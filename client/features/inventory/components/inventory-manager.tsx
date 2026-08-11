"use client";

import { useState } from "react";
import { Boxes, Pencil, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
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
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { useBranches } from "@/features/branch/hooks/use-branches";
import { usePaginatedStockItems } from "@/features/inventory/hooks/use-paginated-stock-items";
import { inventoryService } from "@/features/inventory/services/inventory.service";
import { StockItemDialog } from "@/features/inventory/components/stock-item-dialog";
import { AdjustStockDialog } from "@/features/inventory/components/adjust-stock-dialog";
import type { StockItem } from "@/features/inventory/types/inventory.types";

export function InventoryManager() {
  const { branches, loading: branchesLoading } = useBranches();
  const [pickedBranch, setPickedBranch] = useState("");
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const confirm = useConfirm();

  const [editing, setEditing] = useState<StockItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adjusting, setAdjusting] = useState<StockItem | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);

  // Effective branch: the user's pick, else the first branch once loaded.
  const branchId = pickedBranch || branches[0]?.id || "";
  const setBranchId = setPickedBranch;

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
  } = usePaginatedStockItems({
    branchId: branchId || undefined,
    search: search.trim() || undefined,
    lowStock: lowOnly,
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (item: StockItem) => {
    setEditing(item);
    setDialogOpen(true);
  };
  const openAdjust = (item: StockItem) => {
    setAdjusting(item);
    setAdjustOpen(true);
  };

  const remove = async (item: StockItem) => {
    const ok = await confirm({
      title: `Delete ${item.name}?`,
      description:
        "This removes the item, its stock levels and recipe links. This can't be undone.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await inventoryService.deleteStockItem(item.id);
      toast("Stock item deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't delete", { tone: "error" });
    }
  };

  const branchOptions = [...branches.map((b) => ({ value: b.id, label: b.name }))];

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="pl-9"
          />
        </div>
        <Dropdown
          className="w-48"
          value={branchId}
          onChange={setBranchId}
          placeholder={branchesLoading ? "Loading…" : "Select branch"}
          options={branchOptions}
        />
        <button
          type="button"
          onClick={() => setLowOnly((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            lowOnly
              ? "border-amber-300 bg-accent-tint text-amber-700"
              : "border-border text-muted-foreground hover:bg-secondary",
          )}
        >
          <SlidersHorizontal className="size-4" /> Low stock
        </button>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 size-4" /> New item
        </Button>
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            className="py-12"
            icon={Boxes}
            title="Couldn't load"
            description={error}
            action={<button onClick={refetch}>Retry</button>}
          />
        ) : items.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={Boxes}
            title="No stock items"
            description={
              lowOnly ? "Nothing is low right now." : "Add ingredients and goods to track."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Item</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Reorder</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const qty = Number(item.quantity ?? 0);
                  const low = qty <= Number(item.reorderLevel);
                  const out = qty <= 0;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-ink">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={cn(
                              "font-semibold tabular-nums",
                              out ? "text-red-600" : low ? "text-amber-600" : "text-ink",
                            )}
                          >
                            {qty}
                          </span>
                          {out ? (
                            <StatusPill tone="red">Out</StatusPill>
                          ) : low ? (
                            <StatusPill tone="amber">Low</StatusPill>
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {Number(item.reorderLevel)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatMoney(item.costPerUnit)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAdjust(item)}
                            disabled={!branchId}
                          >
                            Adjust
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(item)}>
                            <Trash2 className="size-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
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

      <StockItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        onSaved={refetch}
      />
      <AdjustStockDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        item={adjusting}
        branchId={branchId}
        onSaved={refetch}
      />
    </div>
  );
}
