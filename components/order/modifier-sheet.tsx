"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { ProductHeroMedia } from "@/components/menu/product-hero-media";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import type { CartItemModifier, MenuItem, OrderItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ModifierSheetProps {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, adds to reservation pre-order instead of cart. */
  onAddLine?: (line: OrderItem) => void;
}

export function ModifierSheet({ item, open, onOpenChange, onAddLine }: ModifierSheetProps) {
  const addItem = useCart((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState("");

  const reset = () => {
    setQuantity(1);
    setSelected({});
    setNotes("");
  };

  const modifiers: CartItemModifier[] = useMemo(() => {
    if (!item) return [];
    const result: CartItemModifier[] = [];
    for (const group of item.modifiers) {
      const optionIds = selected[group.id] ?? [];
      for (const optId of optionIds) {
        const opt = group.options.find((o) => o.id === optId);
        if (opt) {
          result.push({
            groupId: group.id,
            optionId: opt.id,
            label: opt.label,
            priceDelta: opt.priceDelta,
          });
        }
      }
    }
    return result;
  }, [item, selected]);

  const unitTotal = useMemo(() => {
    if (!item) return 0;
    return item.price + modifiers.reduce((s, m) => s + m.priceDelta, 0);
  }, [item, modifiers]);

  const missingRequired = useMemo(() => {
    if (!item) return [];
    return item.modifiers
      .filter((g) => g.required && !(selected[g.id]?.length))
      .map((g) => g.label);
  }, [item, selected]);

  const toggleOption = (groupId: string, optionId: string, multiple: boolean) => {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (multiple) {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [groupId]: next };
      }
      return { ...prev, [groupId]: [optionId] };
    });
  };

  const handleAdd = () => {
    if (!item || missingRequired.length > 0) return;
    const line: OrderItem = {
      menuItemId: item.id,
      name: item.name,
      unitPrice: item.price,
      quantity,
      modifiers,
      notes: notes.trim() || undefined,
    };
    if (onAddLine) {
      onAddLine(line);
    } else {
      addItem({
        ...line,
        imageUrl: item.imageUrl,
      });
    }
    reset();
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{item.name}</SheetTitle>
          <SheetDescription>{item.description}</SheetDescription>
        </SheetHeader>

        <ProductHeroMedia
          item={item}
          className="mx-6 aspect-[2/1] rounded-xl"
          sizes="100vw"
        />

        <div className="space-y-6 px-6">
          {item.modifiers.map((group) => (
            <div key={group.id}>
              <p className="font-medium text-ink">
                {group.label}
                {group.required && <span className="text-destructive"> *</span>}
              </p>
              <div className="mt-2 space-y-2">
                {group.options.map((opt) => {
                  const checked = (selected[group.id] ?? []).includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleOption(group.id, opt.id, group.multiple)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                        checked
                          ? "border-brand bg-brand-tint"
                          : "border-border hover:bg-secondary",
                      )}
                    >
                      <span>{opt.label}</span>
                      <span className="text-muted-foreground">
                        {opt.priceDelta > 0 ? `+${formatCurrency(opt.priceDelta)}` : "Included"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <label htmlFor="item-notes" className="text-sm font-medium text-ink">
              Special instructions
            </label>
            <textarea
              id="item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Allergies, preferences…"
              rows={2}
              className="mt-2 w-full rounded-xl border border-input bg-white px-3.5 py-2 text-sm shadow-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
            >
              <Minus className="size-4" />
            </Button>
            <span className="min-w-[2ch] text-center text-lg font-semibold">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Increase quantity"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        <SheetFooter className="sticky bottom-0 border-t border-border bg-surface">
          <Button
            className="w-full"
            size="lg"
            disabled={missingRequired.length > 0}
            onClick={handleAdd}
          >
            Add {onAddLine ? "to pre-order" : "to cart"} · {formatCurrency(unitTotal * quantity)}
          </Button>
          {missingRequired.length > 0 && (
            <p className="text-center text-xs text-destructive">
              Select: {missingRequired.join(", ")}
            </p>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
