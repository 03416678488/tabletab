"use client";

import { useState } from "react";
import { ClipboardList, PackageCheck, Pencil, Plus, Trash2, XCircle } from "lucide-react";

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
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/datetime";

import { useBranches } from "@/features/branch/hooks/use-branches";
import { usePaginatedPurchaseOrders } from "@/features/purchasing/hooks/use-paginated-purchase-orders";
import { purchasingService } from "@/features/purchasing/services/purchasing.service";
import { PurchaseOrderDialog } from "@/features/purchasing/components/purchase-order-dialog";
import type {
  PurchaseOrder,
  PurchaseOrderStatus,
} from "@/features/purchasing/types/purchasing.types";

const STATUS_META: Record<
  PurchaseOrderStatus,
  { label: string; tone: "neutral" | "blue" | "green" | "red" }
> = {
  draft: { label: "Draft", tone: "neutral" },
  ordered: { label: "Ordered", tone: "blue" },
  received: { label: "Received", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
};

export function PurchaseOrderManager() {
  const { branches } = useBranches();
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);
  const [open, setOpen] = useState(false);
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
  } = usePaginatedPurchaseOrders({
    branchId: branchId || undefined,
    status: (status || undefined) as PurchaseOrderStatus | undefined,
  });

  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? "—";

  const create = () => {
    setEditing(null);
    setOpen(true);
  };
  const edit = (po: PurchaseOrder) => {
    setEditing(po);
    setOpen(true);
  };

  const receive = async (po: PurchaseOrder) => {
    const ok = await confirm({
      title: `Receive ${po.reference}?`,
      description: `This adds the ordered quantities to ${branchName(po.branchId)}'s stock. It can't be undone.`,
      confirmLabel: "Receive",
      tone: "default",
    });
    if (!ok) return;
    try {
      await purchasingService.receivePurchaseOrder(po.id);
      toast(`${po.reference} received — stock updated`, { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't receive", { tone: "error" });
    }
  };

  const cancel = async (po: PurchaseOrder) => {
    const ok = await confirm({ title: `Cancel ${po.reference}?`, confirmLabel: "Cancel PO" });
    if (!ok) return;
    try {
      await purchasingService.cancelPurchaseOrder(po.id);
      toast("Purchase order cancelled", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't cancel", { tone: "error" });
    }
  };

  const remove = async (po: PurchaseOrder) => {
    const ok = await confirm({ title: `Delete ${po.reference}?`, confirmLabel: "Delete" });
    if (!ok) return;
    try {
      await purchasingService.deletePurchaseOrder(po.id);
      toast("Purchase order deleted", { tone: "success" });
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
            { value: "ordered", label: "Ordered" },
            { value: "received", label: "Received" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
        <div className="flex-1" />
        <Button onClick={create}>
          <Plus className="mr-1.5 size-4" /> New order
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
            icon={ClipboardList}
            title="Couldn't load"
            description={error}
          />
        ) : items.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={ClipboardList}
            title="No purchase orders"
            description="Draft an order to restock a branch."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Reference</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((po) => {
                  const meta = STATUS_META[po.status];
                  const receivable = po.status === "draft" || po.status === "ordered";
                  return (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium text-ink">{po.reference}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {po.supplier?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {branchName(po.branchId)}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(po.createdAt)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-ink tabular-nums">
                        {formatMoney(po.total)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {receivable && (
                            <Button variant="ghost" size="sm" onClick={() => receive(po)}>
                              <PackageCheck className="mr-1 size-4 text-emerald-600" /> Receive
                            </Button>
                          )}
                          {po.status === "draft" && (
                            <Button variant="ghost" size="icon" onClick={() => edit(po)}>
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          {receivable && (
                            <Button variant="ghost" size="icon" onClick={() => cancel(po)}>
                              <XCircle className="size-4 text-amber-600" />
                            </Button>
                          )}
                          {po.status !== "received" && (
                            <Button variant="ghost" size="icon" onClick={() => remove(po)}>
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

      <PurchaseOrderDialog open={open} onOpenChange={setOpen} order={editing} onSaved={refetch} />
    </div>
  );
}
