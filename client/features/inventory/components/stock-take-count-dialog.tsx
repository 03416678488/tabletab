"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { inventoryService } from "@/features/inventory/services/inventory.service";
import type { StockTake } from "@/features/inventory/types/inventory.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The draft take to count. */
  takeId: string | null;
  onSaved: () => void;
}

interface Row {
  stockItemId: string;
  name: string;
  unit: string;
  systemQty: number;
  counted: string;
}

export function StockTakeCountDialog({ open, onOpenChange, takeId, onSaved }: Props) {
  const [take, setTake] = useState<StockTake | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !takeId) return;
    let cancelled = false;
    setLoading(true);
    inventoryService
      .getStockTake(takeId)
      .then((t) => {
        if (cancelled) return;
        setTake(t);
        setRows(
          (t.lines ?? []).map((l) => ({
            stockItemId: l.stockItemId,
            name: l.stockItem?.name ?? "—",
            unit: l.stockItem?.unit ?? "",
            systemQty: Number(l.systemQty),
            counted: String(l.countedQty),
          })),
        );
      })
      .catch(
        (err) =>
          !cancelled &&
          toast(err instanceof ApiError ? err.message : "Couldn't load count", { tone: "error" }),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, takeId]);

  const setCount = (id: string, value: string) =>
    setRows((prev) => prev.map((r) => (r.stockItemId === id ? { ...r, counted: value } : r)));

  const linesPayload = () =>
    rows.map((r) => ({ stockItemId: r.stockItemId, countedQty: Number(r.counted) || 0 }));

  const save = async () => {
    if (!takeId) return;
    setSaving(true);
    try {
      await inventoryService.updateStockTake(takeId, { lines: linesPayload() });
      toast("Counts saved", { tone: "success" });
      onSaved();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't save", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const complete = async () => {
    if (!takeId) return;
    setSaving(true);
    try {
      // Persist the latest counts, then reconcile.
      await inventoryService.updateStockTake(takeId, { lines: linesPayload() });
      await inventoryService.completeStockTake(takeId);
      toast("Count completed — stock reconciled", { tone: "success" });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't complete", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Count {take?.reference ?? ""}</DialogTitle>
          <DialogDescription>
            Enter what you physically counted. Completing adjusts stock to match.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="max-h-[55vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">System</TableHead>
                  <TableHead className="text-right">Counted</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const variance = (Number(r.counted) || 0) - r.systemQty;
                  return (
                    <TableRow key={r.stockItemId}>
                      <TableCell className="font-medium text-ink">
                        {r.name}
                        <span className="ml-1 text-xs text-muted-foreground">({r.unit})</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {r.systemQty}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          value={r.counted}
                          onChange={(e) => setCount(r.stockItemId, e.target.value)}
                          className="ml-auto w-24 text-right"
                        />
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold tabular-nums",
                          variance === 0
                            ? "text-muted-foreground"
                            : variance > 0
                              ? "text-emerald-600"
                              : "text-red-600",
                        )}
                      >
                        {variance > 0 ? "+" : ""}
                        {variance}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={save} disabled={saving || loading}>
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Save counts
          </Button>
          <Button onClick={complete} disabled={saving || loading}>
            Complete &amp; reconcile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
