"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, SlidersHorizontal, Trash2, UtensilsCrossed, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";
import { formatCurrency } from "@/lib/utils";

import { useMenuItems } from "@/features/menu/hooks/use-menu-items";
import { menuService } from "@/features/menu/services/menu.service";
import { MenuFormDialog } from "@/features/menu/components/menu-form-dialog";
import { useCategories } from "@/features/category/hooks/use-categories";
import type { MenuItem } from "@/features/menu/types/menu.types";

const SELECT_CLASS =
  "h-9 appearance-none rounded-lg border border-input bg-white px-3 pr-8 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30";

type AvailFilter = "all" | "available" | "unavailable";

export function MenuManager() {
  const { items, loading, error, refetch } = useMenuItems();
  const { categories } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryId, setCategoryId] = useState<string>("all");
  const [avail, setAvail] = useState<AvailFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((m) => {
      if (categoryId !== "all" && m.categoryId !== categoryId) return false;
      if (avail === "available" && !m.isAvailable) return false;
      if (avail === "unavailable" && m.isAvailable) return false;
      if (q && !`${m.name} ${m.description ?? ""}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [items, search, categoryId, avail]);

  const activeFilters = (categoryId !== "all" ? 1 : 0) + (avail !== "all" ? 1 : 0);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setDialogOpen(true);
  };
  const clearFilters = () => {
    setCategoryId("all");
    setAvail("all");
  };

  const confirm = useConfirm();

  const remove = async (item: MenuItem) => {
    if (!(await confirm({ title: `Delete "${item.name}"?`, confirmLabel: "Delete" }))) return;
    try {
      await menuService.remove(item.id);
      toast("Menu item deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete item", {
        tone: "error",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
            Menu
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {items.length} item{items.length === 1 ? "" : "s"} · manage your dishes.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" /> Add item
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu…"
            className="h-9 pl-9"
            aria-label="Search menu"
          />
        </div>
        <Button
          variant={showFilters || activeFilters ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="size-4" /> Filters
          {activeFilters > 0 && (
            <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white">
              {activeFilters}
            </span>
          )}
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} of {items.length}
        </span>
      </div>

      {showFilters && (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Category
            <select
              className={SELECT_CLASS}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="all">All</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Availability
            <select
              className={SELECT_CLASS}
              value={avail}
              onChange={(e) => setAvail(e.target.value as AvailFilter)}
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </label>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="size-4" /> Clear
            </Button>
          )}
        </div>
      )}

      <Card className="mt-4 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <EmptyState
            className="py-12"
            icon={UtensilsCrossed}
            title="Couldn't load menu"
            description={error}
            action={
              <Button variant="outline" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={UtensilsCrossed}
            title={items.length === 0 ? "No menu items yet" : "No matches"}
            description={
              items.length === 0
                ? "Add your first dish to get started."
                : "Try adjusting your search or filters."
            }
            action={
              items.length === 0 ? (
                <Button onClick={openCreate}>
                  <Plus className="size-4" /> Add item
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.category?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCurrency(item.price)}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={item.isAvailable ? "green" : "neutral"}>
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => remove(item)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <MenuFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        onSaved={refetch}
      />
    </div>
  );
}
