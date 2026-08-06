"use client";

import { useState } from "react";
import { Pencil, Plus, Salad, Search, SlidersHorizontal, Trash2, X } from "lucide-react";

import { AppImage } from "@/components/ui/app-image";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
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

import { usePaginatedFoodTypes } from "@/features/food-type/hooks/use-paginated-food-types";
import { foodTypeService } from "@/features/food-type/services/food-type.service";
import { FoodTypeFormDialog } from "@/features/food-type/components/food-type-form-dialog";
import type { FoodType } from "@/features/food-type/types/food-type.types";

const SELECT_CLASS =
  "h-9 appearance-none rounded-lg border border-input bg-white px-3 pr-8 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30";

type StatusFilter = "all" | "active" | "inactive";

export function FoodTypeManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FoodType | null>(null);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");

  // Search + status are applied server-side; the list is paginated.
  const isActive = status === "all" ? undefined : status === "active";
  const { foodTypes, loading, error, page, perPage, setPerPage, totalPages, totalItems, goToPage, refetch } =
    usePaginatedFoodTypes({ search, isActive });

  const activeFilters = status !== "all" ? 1 : 0;
  const filtersActive = Boolean(search.trim()) || status !== "all";

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (foodType: FoodType) => {
    setEditing(foodType);
    setDialogOpen(true);
  };

  const confirm = useConfirm();

  const remove = async (foodType: FoodType) => {
    if (!(await confirm({ title: `Delete "${foodType.name}"?`, confirmLabel: "Delete" }))) return;
    try {
      await foodTypeService.remove(foodType.id);
      toast("Food type deleted", { tone: "success" });
      if (foodTypes.length === 1 && page > 1) goToPage(page - 1);
      else refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete food type", {
        tone: "error",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
            Food Types
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalItems} type{totalItems === 1 ? "" : "s"} · tag your dishes.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" /> Add food type
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search food types…"
            className="h-9 pl-9"
            aria-label="Search food types"
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
          {foodTypes.length} of {totalItems}
        </span>
      </div>

      {showFilters && (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Status
            <select
              className={SELECT_CLASS}
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
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
            icon={Salad}
            title="Couldn't load food types"
            description={error}
            action={
              <Button variant="outline" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : foodTypes.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={Salad}
            title={filtersActive ? "No matches" : "No food types yet"}
            description={
              filtersActive
                ? "Try adjusting your search or filters."
                : "Add your first food type to tag dishes."
            }
            action={
              filtersActive ? undefined : (
                <Button onClick={openCreate}>
                  <Plus className="size-4" /> Add food type
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foodTypes.map((foodType) => (
                <TableRow key={foodType.id}>
                  <TableCell>
                    <AppImage
                      src={foodType.imageUrl}
                      alt={foodType.name}
                      width={40}
                      height={40}
                      fallbackIcon={Salad}
                      className="size-10 rounded-lg object-cover"
                      fallbackClassName="size-10 rounded-lg"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{foodType.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {foodType.description || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {foodType.sortOrder}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={foodType.isActive ? "green" : "neutral"}>
                      {foodType.isActive ? "Active" : "Inactive"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit"
                        onClick={() => openEdit(foodType)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => remove(foodType)}
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

      {!loading && !error && foodTypes.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={goToPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          className="mt-4"
        />
      )}

      <FoodTypeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        foodType={editing}
        onSaved={refetch}
      />
    </div>
  );
}
