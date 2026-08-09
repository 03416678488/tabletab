"use client";

import { useState } from "react";
import { Pencil, Plus, Search, SlidersHorizontal, Trash2, UtensilsCrossed, X } from "lucide-react";

import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { TableRowsSkeleton } from "@/components/ui/table-rows-skeleton";
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

import { useMenuItemsTable } from "@/features/menu/hooks/use-menu-items-table";
import { Pagination } from "@/components/ui/pagination";
import { menuService } from "@/features/menu/services/menu.service";
import { MenuFormDialog } from "@/features/menu/components/menu-form-dialog";
import { useCategories } from "@/features/category/hooks/use-categories";
import type { MenuItem } from "@/features/menu/types/menu.types";

type AvailFilter = "all" | "available" | "unavailable";

export function MenuManager() {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryId, setCategoryId] = useState<string>("all");
  const [avail, setAvail] = useState<AvailFilter>("all");

  const {
    items,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  } = useMenuItemsTable({
    search,
    categoryId,
    isAvailable: avail === "all" ? undefined : avail === "available",
  });
  const { categories } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

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
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">Menu</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalItems} item{totalItems === 1 ? "" : "s"} · manage your dishes.
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
          {items.length} of {totalItems}
        </span>
      </div>

      {showFilters && (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Category
            <Dropdown
              className="w-44"
              value={categoryId}
              onChange={(v) => setCategoryId(v)}
              searchable
              aria-label="Filter by category"
              options={[
                { value: "all", label: "All" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Availability
            <Dropdown
              className="w-40"
              value={avail}
              onChange={(v) => setAvail(v as AvailFilter)}
              aria-label="Filter by availability"
              options={[
                { value: "all", label: "All" },
                { value: "available", label: "Available" },
                { value: "unavailable", label: "Unavailable" },
              ]}
            />
          </div>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="size-4" /> Clear
            </Button>
          )}
        </div>
      )}

      <Card className="mt-4 overflow-hidden p-0">
        {loading ? (
          <TableRowsSkeleton />
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
        ) : items.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={UtensilsCrossed}
            title={search.trim() || activeFilters ? "No matches" : "No menu items yet"}
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
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <AppImage
                      src={item.imageUrl || item.images?.[0]}
                      alt={item.name}
                      width={40}
                      height={40}
                      fallbackIcon={UtensilsCrossed}
                      className="size-10 rounded-lg object-cover"
                      fallbackClassName="size-10 rounded-lg"
                    />
                  </TableCell>
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

      {!loading && !error && items.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={goToPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          className="mt-4"
        />
      )}

      <MenuFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        onSaved={refetch}
      />
    </div>
  );
}
