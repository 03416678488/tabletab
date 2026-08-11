"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/currency";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { useBranches } from "@/features/branch/hooks/use-branches";
import { inventoryService } from "@/features/inventory/services/inventory.service";
import type { StockItem } from "@/features/inventory/types/inventory.types";
import { purchasingService } from "@/features/purchasing/services/purchasing.service";
import type { PurchaseOrder, Supplier } from "@/features/purchasing/types/purchasing.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create, an order (draft) = edit. */
  order: PurchaseOrder | null;
  onSaved: () => void;
}

interface LineDraft {
  stockItemId: string;
  quantity: string;
  unitCost: string;
}

const emptyLine = (): LineDraft => ({ stockItemId: "", quantity: "", unitCost: "" });

export function PurchaseOrderDialog({ open, onOpenChange, order, onSaved }: Props) {
  const { branches } = useBranches();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  const [branchId, setBranchId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdit = !!order;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      purchasingService.listSuppliers({ perPage: 200, isActive: "true" }),
      inventoryService.listStockItems({ perPage: 200, isActive: "true" }),
      order ? purchasingService.getPurchaseOrder(order.id) : Promise.resolve(null),
    ])
      .then(([sup, stock, full]) => {
        if (cancelled) return;
        setSuppliers(sup.items);
        setStockItems(stock.items);
        setBranchId(full?.branchId ?? order?.branchId ?? "");
        setSupplierId(full?.supplierId ?? "");
        setNotes(full?.notes ?? "");
        setLines(
          full?.lines?.length
            ? full.lines.map((l) => ({
                stockItemId: l.stockItemId,
                quantity: String(l.quantity),
                unitCost: String(l.unitCost),
              }))
            : [emptyLine()],
        );
      })
      .catch(
        (err) =>
          !cancelled &&
          toast(err instanceof ApiError ? err.message : "Couldn't load", { tone: "error" }),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, order]);

  const stockOptions = stockItems.map((s) => ({ value: s.id, label: `${s.name} (${s.unit})` }));
  const supplierOptions = [
    { value: "", label: "No supplier" },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ];
  const branchOptions = branches.map((b) => ({ value: b.id, label: b.name }));

  const addLine = () => setLines((p) => [...p, emptyLine()]);
  const updateLine = (i: number, patch: Partial<LineDraft>) =>
    setLines((p) => p.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLine = (i: number) => setLines((p) => p.filter((_, idx) => idx !== i));

  const total = useMemo(
    () => lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0),
    [lines],
  );

  const submit = async () => {
    if (!branchId) {
      toast("Pick a branch", { tone: "error" });
      return;
    }
    const clean = lines
      .filter((l) => l.stockItemId && Number(l.quantity) > 0)
      .map((l) => ({
        stockItemId: l.stockItemId,
        quantity: Number(l.quantity),
        unitCost: Number(l.unitCost) || 0,
      }));
    if (clean.length === 0) {
      toast("Add at least one line", { tone: "error" });
      return;
    }
    setSaving(true);
    try {
      if (order) {
        await purchasingService.updatePurchaseOrder(order.id, {
          supplierId: supplierId || undefined,
          notes: notes.trim() || undefined,
          lines: clean,
        });
      } else {
        await purchasingService.createPurchaseOrder({
          branchId,
          supplierId: supplierId || undefined,
          notes: notes.trim() || undefined,
          lines: clean,
        });
      }
      toast(order ? "Purchase order updated" : "Purchase order created", { tone: "success" });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't save", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{order ? `Edit ${order.reference}` : "New purchase order"}</DialogTitle>
          <DialogDescription>
            Draft an order, then receive it to add the stock to a branch.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Branch</Label>
                <Dropdown
                  value={branchId}
                  onChange={setBranchId}
                  placeholder="Select branch"
                  options={branchOptions}
                  disabled={isEdit}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Supplier</Label>
                <Dropdown value={supplierId} onChange={setSupplierId} options={supplierOptions} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Items</Label>
              <div className="space-y-2">
                {lines.map((line, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Dropdown
                        value={line.stockItemId}
                        onChange={(v) => updateLine(i, { stockItemId: v })}
                        placeholder="Stock item"
                        options={stockOptions}
                      />
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="0.001"
                      value={line.quantity}
                      onChange={(e) => updateLine(i, { quantity: e.target.value })}
                      placeholder="Qty"
                      className="w-20"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitCost}
                      onChange={(e) => updateLine(i, { unitCost: e.target.value })}
                      placeholder="Unit cost"
                      className="w-28"
                    />
                    <span className="w-20 text-right text-sm tabular-nums text-muted-foreground">
                      {formatMoney((Number(line.quantity) || 0) * (Number(line.unitCost) || 0))}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => removeLine(i)}>
                      <Trash2 className="size-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={addLine}>
                <Plus className="mr-1.5 size-4" /> Add item
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="po-notes">Notes (optional)</Label>
              <Input id="po-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="text-base font-semibold text-ink tabular-nums">
                {formatMoney(total)}
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || loading}>
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            {order ? "Save changes" : "Create draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
