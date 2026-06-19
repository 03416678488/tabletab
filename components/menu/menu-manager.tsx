"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Box,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Search,
  UtensilsCrossed,
} from "lucide-react";
import { isModel3dUrl } from "@/lib/model-3d-utils";
import { MenuItemSheet } from "@/components/menu/menu-item-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { useMenuStore } from "@/hooks/use-menu-store";
import { toast } from "@/hooks/use-toast";
import type { MenuItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function MenuManager() {
  const hydrated = useMenuStore((s) => s.hydrated);
  const categories = useMenuStore((s) => s.categories);
  const items = useMenuStore((s) => s.items);
  const reorderCategory = useMenuStore((s) => s.reorderCategory);
  const addItem = useMenuStore((s) => s.addItem);
  const updateItem = useMenuStore((s) => s.updateItem);
  const toggleItemAvailability = useMenuStore((s) => s.toggleItemAvailability);
  const addCategory = useMenuStore((s) => s.addCategory);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (selectedCategory !== "all" && it.categoryId !== selectedCategory) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.tags.some((t) => t.includes(q))
      );
    });
  }, [items, search, selectedCategory]);

  const openAdd = () => {
    setEditingItem(null);
    setSheetOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setSheetOpen(true);
  };

  const handleSave = (input: Parameters<typeof addItem>[0]) => {
    if (editingItem) {
      updateItem(editingItem.id, input);
      toast("Item updated", { tone: "success" });
    } else {
      addItem(input);
      toast("Item added", { tone: "success" });
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName("");
    toast("Category added", { tone: "success" });
  };

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <Skeleton className="h-80" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Menu</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} items · {categories.length} categories
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add item
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Categories */}
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Categories
            </p>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                    selectedCategory === "all"
                      ? "bg-brand-tint text-brand-deep"
                      : "hover:bg-secondary",
                  )}
                >
                  All items
                </button>
              </li>
              {sortedCategories.map((cat, idx) => (
                <li key={cat.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                      selectedCategory === cat.id
                        ? "bg-brand-tint text-brand-deep"
                        : "hover:bg-secondary",
                    )}
                  >
                    {cat.name}
                  </button>
                  <div className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      className="rounded p-0.5 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                      disabled={idx === 0}
                      onClick={() => reorderCategory(cat.id, "up")}
                      aria-label="Move up"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-0.5 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                      disabled={idx === sortedCategories.length - 1}
                      onClick={() => reorderCategory(cat.id, "down")}
                      aria-label="Move down"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2 border-t border-border pt-4">
              <Input
                placeholder="New category…"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-9 text-sm"
              />
              <Button size="sm" variant="outline" onClick={handleAddCategory}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Items grid */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="No items found"
              description={search ? "Try a different search term." : "Add your first menu item."}
              action={
                !search ? (
                  <Button onClick={openAdd}>
                    <Plus className="size-4" />
                    Add item
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className={cn(
                    "overflow-hidden transition-opacity",
                    !item.isAvailable && "opacity-70",
                  )}
                >
                  <div className="relative aspect-[4/3] bg-subtle">
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                    <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                      {!item.isAvailable && <StatusPill tone="red">Sold out</StatusPill>}
                      {isModel3dUrl(item.model3dUrl) && (
                        <StatusPill tone="brand" dot={false} className="gap-1 px-2 text-[10px]">
                          <Box className="size-3" aria-hidden />
                          3D
                        </StatusPill>
                      )}
                    </div>
                  </div>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-ink">{item.name}</p>
                        <p className="text-sm font-medium text-brand">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                      <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 2).map((t) => (
                        <StatusPill key={t} tone="neutral" dot={false} className="text-[10px] px-2">
                          {t}
                        </StatusPill>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(item)}>
                        Edit
                      </Button>
                      <Button
                        variant={item.isAvailable ? "secondary" : "default"}
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          toggleItemAvailability(item.id);
                          toast(item.isAvailable ? "Marked sold out" : "Back in stock", {
                            tone: "success",
                          });
                        }}
                      >
                        {item.isAvailable ? "Sold out" : "Restock"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <MenuItemSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        categories={sortedCategories}
        item={editingItem}
        defaultCategoryId={selectedCategory !== "all" ? selectedCategory : undefined}
        onSave={handleSave}
      />
    </div>
  );
}
