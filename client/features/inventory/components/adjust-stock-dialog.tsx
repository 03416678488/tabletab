"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { inventoryService } from "@/features/inventory/services/inventory.service";
import type { StockItem, StockMovementType } from "@/features/inventory/types/inventory.types";

/** Movement types with their fixed direction (adjustment is user-chosen). */
const TYPE_OPTIONS: { value: StockMovementType; label: string; sign: 1 | -1 | 0 }[] = [
  { value: "purchase", label: "Purchase (add)", sign: 1 },
  { value: "waste", label: "Waste (remove)", sign: -1 },
  { value: "transfer_in", label: "Transfer in (add)", sign: 1 },
  { value: "transfer_out", label: "Transfer out (remove)", sign: -1 },
  { value: "adjustment", label: "Adjustment", sign: 0 },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: StockItem | null;
  branchId: string;
  onSaved: () => void;
}

export function AdjustStockDialog({ open, onOpenChange, item, branchId, onSaved }: Props) {
  const [type, setType] = useState<StockMovementType>("purchase");
  const [amount, setAmount] = useState("");
  const [adjustDir, setAdjustDir] = useState<1 | -1>(1);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType("purchase");
    setAmount("");
    setAdjustDir(1);
    setNote("");
  }, [open]);

  const typeSign = TYPE_OPTIONS.find((t) => t.value === type)?.sign ?? 1;
  const sign = typeSign === 0 ? adjustDir : typeSign;
  const delta = useMemo(() => (Number(amount) || 0) * sign, [amount, sign]);
  const projected = item ? Number(item.quantity ?? 0) + delta : 0;

  const submit = async () => {
    if (!item) return;
    if (!(Number(amount) > 0)) {
      toast("Enter an amount greater than zero", { tone: "error" });
      return;
    }
    setSaving(true);
    try {
      await inventoryService.adjust({
        stockItemId: item.id,
        branchId,
        type,
        delta,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      toast("Stock updated", { tone: "success" });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't adjust stock", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust stock{item ? ` — ${item.name}` : ""}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Dropdown
              value={type}
              onChange={(v) => setType(v as StockMovementType)}
              options={TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
            />
          </div>

          {typeSign === 0 && (
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <div className="flex gap-2">
                {([1, -1] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setAdjustDir(d)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      adjustDir === d
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {d === 1 ? "Add" : "Remove"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="adjust-amount">Amount ({item?.unit})</Label>
            <Input
              id="adjust-amount"
              type="number"
              min="0"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adjust-note">Note (optional)</Label>
            <Input
              id="adjust-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason / reference"
            />
          </div>

          {item && Number(amount) > 0 && (
            <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">
              On-hand: {Number(item.quantity ?? 0)} →{" "}
              <span className={cn("font-semibold", projected < 0 ? "text-red-600" : "text-ink")}>
                {projected}
              </span>{" "}
              {item.unit}
              {projected < 0 && " (negative — allowed, will alert)"}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
