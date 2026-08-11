"use client";

import { useEffect, useState } from "react";
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
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { inventoryService } from "@/features/inventory/services/inventory.service";
import type { StockItem, StockUnit } from "@/features/inventory/types/inventory.types";

const UNIT_OPTIONS: { value: StockUnit; label: string }[] = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "l", label: "Litres (L)" },
  { value: "ml", label: "Millilitres (ml)" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create, a stock item = edit. */
  item: StockItem | null;
  onSaved: () => void;
}

export function StockItemDialog({ open, onOpenChange, item, onSaved }: Props) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<StockUnit>("pcs");
  const [costPerUnit, setCostPerUnit] = useState("0");
  const [reorderLevel, setReorderLevel] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setUnit(item?.unit ?? "pcs");
    setCostPerUnit(String(item?.costPerUnit ?? 0));
    setReorderLevel(String(item?.reorderLevel ?? 0));
  }, [open, item]);

  const submit = async () => {
    if (!name.trim()) {
      toast("Name is required", { tone: "error" });
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        unit,
        costPerUnit: Number(costPerUnit) || 0,
        reorderLevel: Number(reorderLevel) || 0,
      };
      if (item) await inventoryService.updateStockItem(item.id, body);
      else await inventoryService.createStockItem(body);
      toast(item ? "Stock item updated" : "Stock item created", { tone: "success" });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't save stock item", {
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit stock item" : "New stock item"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="stock-name">Name</Label>
            <Input
              id="stock-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken breast"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Dropdown
                value={unit}
                onChange={(v) => setUnit(v as StockUnit)}
                options={UNIT_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock-cost">Cost / unit</Label>
              <Input
                id="stock-cost"
                type="number"
                min="0"
                step="0.01"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stock-reorder">Reorder level</Label>
            <Input
              id="stock-reorder"
              type="number"
              min="0"
              step="0.01"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Alert managers when on-hand drops to or below this.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            {item ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
