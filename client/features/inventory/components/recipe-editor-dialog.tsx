"use client";

import { useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { inventoryService } from "@/features/inventory/services/inventory.service";
import type { MenuItem } from "@/features/menu/types/menu.types";
import type { ItemTrackingType, StockItem } from "@/features/inventory/types/inventory.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem: MenuItem | null;
  onSaved: () => void;
}

interface LineDraft {
  stockItemId: string;
  quantity: string;
}

const MODES: { value: ItemTrackingType; label: string; hint: string }[] = [
  { value: "none", label: "Not tracked", hint: "Selling this doesn't touch inventory." },
  { value: "recipe", label: "Recipe", hint: "Deducts raw ingredients on each sale." },
  { value: "unit", label: "Unit", hint: "Deducts one unit of a stock item per sale." },
];

export function RecipeEditorDialog({ open, onOpenChange, menuItem, onSaved }: Props) {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [trackingType, setTrackingType] = useState<ItemTrackingType>("none");
  const [unitStockId, setUnitStockId] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !menuItem) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      inventoryService.listStockItems({ perPage: 200, isActive: "true" }),
      inventoryService.getRecipe(menuItem.id),
    ])
      .then(([stock, recipe]) => {
        if (cancelled) return;
        setStockItems(stock.items);
        setTrackingType(recipe.trackingType);
        setUnitStockId(recipe.stockItemId ?? "");
        setLines(
          recipe.lines.map((l) => ({
            stockItemId: l.stockItemId,
            quantity: String(l.quantity),
          })),
        );
      })
      .catch((err) => {
        if (!cancelled)
          toast(err instanceof ApiError ? err.message : "Couldn't load recipe", {
            tone: "error",
          });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, menuItem]);

  const stockOptions = stockItems.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.unit})`,
  }));

  const addLine = () => setLines((prev) => [...prev, { stockItemId: "", quantity: "" }]);
  const updateLine = (i: number, patch: Partial<LineDraft>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));

  const unitOf = (id: string) => stockItems.find((s) => s.id === id)?.unit ?? "";

  const submit = async () => {
    if (!menuItem) return;
    if (trackingType === "unit" && !unitStockId) {
      toast("Pick the stock item this deducts", { tone: "error" });
      return;
    }
    let cleanLines: { stockItemId: string; quantity: number }[] = [];
    if (trackingType === "recipe") {
      cleanLines = lines
        .filter((l) => l.stockItemId && Number(l.quantity) > 0)
        .map((l) => ({ stockItemId: l.stockItemId, quantity: Number(l.quantity) }));
      if (cleanLines.length === 0) {
        toast("Add at least one ingredient", { tone: "error" });
        return;
      }
      const ids = new Set(cleanLines.map((l) => l.stockItemId));
      if (ids.size !== cleanLines.length) {
        toast("Each ingredient can only appear once", { tone: "error" });
        return;
      }
    }
    setSaving(true);
    try {
      await inventoryService.setRecipe(menuItem.id, {
        trackingType,
        ...(trackingType === "unit" ? { stockItemId: unitStockId } : {}),
        ...(trackingType === "recipe" ? { lines: cleanLines } : {}),
      });
      toast("Recipe saved", { tone: "success" });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't save recipe", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inventory — {menuItem?.name}</DialogTitle>
          <DialogDescription>How selling this item draws down stock.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mode picker */}
            <div className="grid grid-cols-3 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setTrackingType(m.value)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition-colors",
                    trackingType === m.value
                      ? "border-brand bg-brand/10"
                      : "border-border hover:bg-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "block text-sm font-semibold",
                      trackingType === m.value ? "text-brand" : "text-ink",
                    )}
                  >
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {MODES.find((m) => m.value === trackingType)?.hint}
            </p>

            {stockItems.length === 0 && trackingType !== "none" && (
              <p className="rounded-lg bg-accent-tint px-3 py-2 text-sm text-amber-700">
                No stock items yet — add some in the Stock tab first.
              </p>
            )}

            {/* Unit mode */}
            {trackingType === "unit" && (
              <div className="space-y-1.5">
                <Label>Stock item</Label>
                <Dropdown
                  value={unitStockId}
                  onChange={setUnitStockId}
                  placeholder="Select stock item"
                  options={stockOptions}
                />
                <p className="text-xs text-muted-foreground">One unit is deducted per item sold.</p>
              </div>
            )}

            {/* Recipe mode */}
            {trackingType === "recipe" && (
              <div className="space-y-2">
                <Label>Ingredients (per one sold)</Label>
                {lines.length === 0 && (
                  <p className="text-sm text-muted-foreground">No ingredients yet.</p>
                )}
                {lines.map((line, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Dropdown
                        value={line.stockItemId}
                        onChange={(v) => updateLine(i, { stockItemId: v })}
                        placeholder="Ingredient"
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
                      className="w-24"
                    />
                    <span className="w-8 text-xs text-muted-foreground">
                      {unitOf(line.stockItemId)}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => removeLine(i)}>
                      <Trash2 className="size-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={addLine} className="mt-1">
                  <Plus className="mr-1.5 size-4" /> Add ingredient
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || loading}>
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
