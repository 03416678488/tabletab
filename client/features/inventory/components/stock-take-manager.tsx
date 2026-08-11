"use client";

import { useState } from "react";
import { ClipboardCheck, Pencil, Plus, Trash2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
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
import { formatDateTime } from "@/lib/datetime";

import { useBranches } from "@/features/branch/hooks/use-branches";
import { usePaginatedStockTakes } from "@/features/inventory/hooks/use-paginated-stock-takes";
import { inventoryService } from "@/features/inventory/services/inventory.service";
import { StockTakeDialog } from "@/features/inventory/components/stock-take-dialog";
import { StockTakeCountDialog } from "@/features/inventory/components/stock-take-count-dialog";
import type { StockTake, StockTakeStatus } from "@/features/inventory/types/inventory.types";

const STATUS_META: Record<StockTakeStatus, { label: string; tone: "neutral" | "green" | "red" }> = {
  draft: { label: "Draft", tone: "neutral" },
  completed: { label: "Completed", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
};

export function StockTakeManager() {
  const { branches } = useBranches();
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [countId, setCountId] = useState<string | null>(null);
  const [countOpen, setCountOpen] = useState(false);
  const confirm = useConfirm();

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
  } = usePaginatedStockTakes({
    branchId: branchId || undefined,
    status: (status || undefined) as StockTakeStatus | undefined,
  });

  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? "—";

  const openCount = (t: StockTake) => {
    setCountId(t.id);
    setCountOpen(true);
  };

  const cancel = async (t: StockTake) => {
    const ok = await confirm({ title: `Cancel ${t.reference}?`, confirmLabel: "Cancel count" });
    if (!ok) return;
    try {
      await inventoryService.cancelStockTake(t.id);
      toast("Count cancelled", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't cancel", { tone: "error" });
    }
  };

  const remove = async (t: StockTake) => {
    const ok = await confirm({ title: `Delete ${t.reference}?`, confirmLabel: "Delete" });
    if (!ok) return;
    try {
      await inventoryService.deleteStockTake(t.id);
      toast("Count deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't delete", { tone: "error" });
    }
  };

  return (
    <div className="w-full">
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Dropdown
          className="w-44"
          value={branchId}
          onChange={setBranchId}
          placeholder="All branches"
          options={[
            { value: "", label: "All branches" },
            ...branches.map((b) => ({ value: b.id, label: b.name })),
          ]}
        />
        <Dropdown
          className="w-40"
          value={status}
          onChange={setStatus}
          placeholder="All statuses"
          options={[
            { value: "", label: "All statuses" },
            { value: "draft", label: "Draft" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
        <div className="flex-1" />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 size-4" /> New count
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
            icon={ClipboardCheck}
            title="Couldn't load"
            description={error}
          />
        ) : items.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={ClipboardCheck}
            title="No stock counts"
            description="Open a count to reconcile system stock against a physical count."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Reference</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((t) => {
                  const meta = STATUS_META[t.status];
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-ink">{t.reference}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {branchName(t.branchId)}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(t.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {t.status === "draft" && (
                            <Button variant="ghost" size="sm" onClick={() => openCount(t)}>
                              <Pencil className="mr-1 size-4" /> Count
                            </Button>
                          )}
                          {t.status === "draft" && (
                            <Button variant="ghost" size="icon" onClick={() => cancel(t)}>
                              <XCircle className="size-4 text-amber-600" />
                            </Button>
                          )}
                          {t.status !== "completed" && (
                            <Button variant="ghost" size="icon" onClick={() => remove(t)}>
                              <Trash2 className="size-4 text-red-500" />
                            </Button>
                          )}
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

      <StockTakeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(take) => {
          refetch();
          openCount(take);
        }}
      />
      <StockTakeCountDialog
        open={countOpen}
        onOpenChange={setCountOpen}
        takeId={countId}
        onSaved={refetch}
      />
    </div>
  );
}
