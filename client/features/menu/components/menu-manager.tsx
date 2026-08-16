"use client";

import { useState } from "react";
import {
  Ban,
  Check,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";

import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { BulkActionBar, SelectCheckbox } from "@/components/ui/bulk-action-bar";
import { useTableSelection } from "@/hooks/use-table-selection";
import { Dropdown } from "@/components/ui/dropdown";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { TableRowsSkeleton } from "@/components/ui/table-rows-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";

import { useMenuItemsTable } from "@/features/menu/hooks/use-menu-items-table";
import { Pagination } from "@/components/ui/pagination";
import { menuService } from "@/features/menu/services/menu.service";
import { MenuFormDialog } from "@/features/menu/components/menu-form-dialog";
import { useCategories } from "@/features/category/hooks/use-categories";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import type { MenuItem } from "@/features/menu/types/menu.types";

type AvailFilter = "all" | "available" | "unavailable";

export function MenuManager() {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryId, setCategoryId] = useState<string>("all");
  const [avail, setAvail] = useState<AvailFilter>("all");

  // Follow the topbar branch: a branch → its carried items with that branch's
  // effective (per-branch) availability; "All branches" (undefined) → the full
  // global catalogue with the master flag. Editing still refetches the full item
  // so cross-branch memberships show correctly.
  const scopedBranchId = useScopedBranchId();
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
    branchId: scopedBranchId,
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
      refetch();
    } catch {}
  };

  // Identity of the current list (page/search/filters/branch) — bulk selection
  // and the optimistic availability map both reset when it changes.
  const listKey = `${page}|${search}|${categoryId}|${avail}|${scopedBranchId ?? ""}`;
  const sel = useTableSelection(items, listKey);
  const [bulkBusy, setBulkBusy] = useState(false);

  const bulkDelete = async () => {
    if (
      !(await confirm({
        title: `Delete ${sel.count} item${sel.count === 1 ? "" : "s"}?`,
        confirmLabel: "Delete",
      }))
    )
      return;
    setBulkBusy(true);
    try {
      await menuService.bulkRemove(sel.ids);
      sel.clear();
      refetch();
    } catch {
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkAvailability = async (isAvailable: boolean) => {
    setBulkBusy(true);
    try {
      // Scoped to a branch → per-branch override; "All branches" → global master.
      await menuService.bulkSetAvailability(sel.ids, isAvailable, scopedBranchId);
      sel.clear();
      refetch();
    } catch {
    } finally {
      setBulkBusy(false);
    }
  };

  // Per-row availability toggle. Optimistic (no full refetch flicker); the map is
  // keyed to `listKey` so it auto-discards when the branch/page/filters change and
  // the server value takes over again.
  const [availState, setAvailState] = useState<{ key: string; map: Record<string, boolean> }>({
    key: listKey,
    map: {},
  });
  const availOverride = availState.key === listKey ? availState.map : {};
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggleRowAvail = async (item: MenuItem) => {
    const current = availOverride[item.id] ?? item.isAvailable;
    const next = !current;
    setAvailState({ key: listKey, map: { ...availOverride, [item.id]: next } });
    setTogglingId(item.id);
    try {
      // Branch scoped → per-branch override; "All branches" → global master.
      await menuService.bulkSetAvailability([item.id], next, scopedBranchId);
    } catch {
      setAvailState({ key: listKey, map: { ...availOverride, [item.id]: current } }); // revert
    } finally {
      setTogglingId(null);
    }
  };

  const bulkMoveCategory = async (catId: string) => {
    if (!catId) return;
    setBulkBusy(true);
    try {
      await menuService.bulkSetCategory(sel.ids, catId);
      sel.clear();
      refetch();
    } catch {
    } finally {
      setBulkBusy(false);
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
          <>
            <BulkActionBar count={sel.count} onClear={sel.clear}>
              <Dropdown
                className="w-44"
                value=""
                onChange={(v) => void bulkMoveCategory(v)}
                disabled={bulkBusy}
                searchable
                placeholder="Move to category…"
                aria-label="Move selected items to a category"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={bulkBusy}
                onClick={() => void bulkAvailability(true)}
              >
                <Check className="size-4" /> Mark available
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkBusy}
                onClick={() => void bulkAvailability(false)}
              >
                <Ban className="size-4" /> Mark unavailable
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={bulkBusy}
                onClick={() => void bulkDelete()}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            </BulkActionBar>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10">
                    <SelectCheckbox
                      checked={sel.allSelected}
                      onChange={sel.toggleAll}
                      label="Select all on this page"
                    />
                  </TableHead>
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
                  <TableRow key={item.id} data-selected={sel.isSelected(item.id) || undefined}>
                    <TableCell>
                      <SelectCheckbox
                        checked={sel.isSelected(item.id)}
                        onChange={() => sel.toggleOne(item.id)}
                        label={`Select ${item.name}`}
                      />
                    </TableCell>
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
                      {item.categories?.length
                        ? [...new Set(item.categories.map((c) => c.name))].join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell>
                      <AvailabilityToggle
                        available={availOverride[item.id] ?? item.isAvailable}
                        busy={togglingId === item.id}
                        scoped={!!scopedBranchId}
                        onToggle={() => void toggleRowAvail(item)}
                      />
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
          </>
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

/** Clickable availability pill — 86 an item inline (per-branch or global master). */
function AvailabilityToggle({
  available,
  busy,
  scoped,
  onToggle,
}: {
  available: boolean;
  busy: boolean;
  scoped: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      aria-pressed={available}
      aria-label="Toggle availability"
      title={
        scoped
          ? "Availability at the selected branch — click to toggle"
          : "Availability everywhere (master) — click to toggle"
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60",
        available
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "bg-red-50 text-red-600 hover:bg-red-100",
      )}
    >
      <span className={cn("size-1.5 rounded-full", available ? "bg-emerald-500" : "bg-red-500")} />
      {available ? "Available" : "Sold out"}
    </button>
  );
}
