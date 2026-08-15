"use client";

import { useState } from "react";
import { Ban, Check, Pencil, Plus, Search, SlidersHorizontal, Tags, Trash2, X } from "lucide-react";

import { AppImage } from "@/components/ui/app-image";

import { Button } from "@/components/ui/button";
import { BulkActionBar, SelectCheckbox } from "@/components/ui/bulk-action-bar";
import { useTableSelection } from "@/hooks/use-table-selection";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
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

import { usePaginatedCategories } from "@/features/category/hooks/use-paginated-categories";
import { categoryService } from "@/features/category/services/category.service";
import { CategoryFormDialog } from "@/features/category/components/category-form-dialog";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import type { Category } from "@/features/category/types/category.types";

type StatusFilter = "all" | "active" | "inactive";

export function CategoryManager() {
  const branchId = useScopedBranchId();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");

  // Search + status are applied server-side; the list is paginated.
  const isActive = status === "all" ? undefined : status === "active";
  const {
    categories,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  } = usePaginatedCategories({ search, isActive, branchId });

  const activeFilters = status !== "all" ? 1 : 0;
  const filtersActive = Boolean(search.trim()) || status !== "all";

  const openCreate = () => {
    if (!branchId) {
      toast("Select a branch first to add a category", { tone: "info" });
      return;
    }
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (category: Category) => {
    setEditing(category);
    setDialogOpen(true);
  };

  const confirm = useConfirm();

  const remove = async (category: Category) => {
    if (!(await confirm({ title: `Delete "${category.name}"?`, confirmLabel: "Delete" }))) return;
    try {
      await categoryService.remove(category.id);
      toast("Category deleted", { tone: "success" });
      if (categories.length === 1 && page > 1) goToPage(page - 1);
      else refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete category", {
        tone: "error",
      });
    }
  };

  // Bulk selection + actions.
  const sel = useTableSelection(categories, `${page}|${search}|${status}`);
  const [bulkBusy, setBulkBusy] = useState(false);

  const bulkDelete = async () => {
    if (
      !(await confirm({
        title: `Delete ${sel.count} categor${sel.count === 1 ? "y" : "ies"}?`,
        confirmLabel: "Delete",
      }))
    )
      return;
    setBulkBusy(true);
    try {
      await categoryService.bulkRemove(sel.ids);
      toast(`Deleted ${sel.count} categor${sel.count === 1 ? "y" : "ies"}`, { tone: "success" });
      sel.clear();
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Bulk delete failed", { tone: "error" });
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkActive = async (next: boolean) => {
    setBulkBusy(true);
    try {
      await categoryService.bulkSetActive(sel.ids, next);
      toast(`${next ? "Activated" : "Deactivated"} ${sel.count}`, { tone: "success" });
      sel.clear();
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Bulk update failed", { tone: "error" });
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">Categories</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalItems} categor{totalItems === 1 ? "y" : "ies"} · organize your menu.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" /> Add category
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="h-9 pl-9"
            aria-label="Search categories"
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
          {categories.length} of {totalItems}
        </span>
      </div>

      {showFilters && (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Status
            <Dropdown
              className="w-40"
              value={status}
              onChange={(v) => setStatus(v as StatusFilter)}
              aria-label="Filter by status"
              options={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </div>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setStatus("all")}>
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
            icon={Tags}
            title="Couldn't load categories"
            description={error}
            action={
              <Button variant="outline" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : categories.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={Tags}
            title={filtersActive ? "No matches" : "No categories yet"}
            description={
              filtersActive
                ? "Try adjusting your search or filters."
                : "Add your first category to organize the menu."
            }
            action={
              filtersActive ? undefined : (
                <Button onClick={openCreate}>
                  <Plus className="size-4" /> Add category
                </Button>
              )
            }
          />
        ) : (
          <>
            <BulkActionBar count={sel.count} onClear={sel.clear}>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkBusy}
                onClick={() => void bulkActive(true)}
              >
                <Check className="size-4" /> Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkBusy}
                onClick={() => void bulkActive(false)}
              >
                <Ban className="size-4" /> Deactivate
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
                  <TableHead>Description</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow
                    key={category.id}
                    data-selected={sel.isSelected(category.id) || undefined}
                  >
                    <TableCell>
                      <SelectCheckbox
                        checked={sel.isSelected(category.id)}
                        onChange={() => sel.toggleOne(category.id)}
                        label={`Select ${category.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <AppImage
                        src={category.imageUrl}
                        alt={category.name}
                        width={40}
                        height={40}
                        fallbackIcon={Tags}
                        className="size-10 rounded-lg object-cover"
                        fallbackClassName="size-10 rounded-lg"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.description || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{category.sortOrder}</TableCell>
                    <TableCell>
                      <StatusPill tone={category.isActive ? "green" : "neutral"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </StatusPill>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit"
                          onClick={() => openEdit(category)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete"
                          onClick={() => remove(category)}
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

      {!loading && !error && categories.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={goToPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          className="mt-4"
        />
      )}

      <CategoryFormDialog
        branchId={branchId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        onSaved={refetch}
      />
    </div>
  );
}
