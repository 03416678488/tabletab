"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/currency";
import type { MenuItem, MenuOptionRow } from "@/features/menu/types/menu.types";

export interface CustomizedLine {
  key: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

interface ItemCustomizeDialogProps {
  item: MenuItem | null;
  onOpenChange: (open: boolean) => void;
  onAdd: (line: CustomizedLine) => void;
}

export function ItemCustomizeDialog({
  item,
  onOpenChange,
  onAdd,
}: ItemCustomizeDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [sizeIndex, setSizeIndex] = useState(-1);
  const [variantIndex, setVariantIndex] = useState(-1);
  const [addonQty, setAddonQty] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState("");

  // Reset the form each time a new item opens.
  useEffect(() => {
    if (!item) return;
    setQuantity(1);
    setSizeIndex(item.sizes.length ? 0 : -1);
    setVariantIndex(item.variants.length ? 0 : -1);
    setAddonQty({});
    setNotes("");
  }, [item]);

  const size = item && sizeIndex >= 0 ? item.sizes[sizeIndex] : undefined;
  const variant =
    item && variantIndex >= 0 ? item.variants[variantIndex] : undefined;

  const addonsTotal = useMemo(() => {
    if (!item) return 0;
    return item.addOns.reduce(
      (sum, a, i) => sum + a.price * (addonQty[i] ?? 0),
      0,
    );
  }, [item, addonQty]);

  const unitPrice = item
    ? item.price + (size?.price ?? 0) + (variant?.price ?? 0) + addonsTotal
    : 0;

  if (!item) return null;

  const setAddon = (i: number, delta: number) =>
    setAddonQty((prev) => ({
      ...prev,
      [i]: Math.max(0, (prev[i] ?? 0) + delta),
    }));

  const buildNotes = (): string | undefined => {
    const parts: string[] = [];
    if (size) parts.push(`Size: ${size.name}`);
    const chosenAddons = item.addOns
      .map((a, i) => ({ a, q: addonQty[i] ?? 0 }))
      .filter((x) => x.q > 0)
      .map((x) => `${x.a.name} x${x.q}`);
    if (chosenAddons.length) parts.push(`Add: ${chosenAddons.join(", ")}`);
    if (notes.trim()) parts.push(notes.trim());
    return parts.length ? parts.join(" · ") : undefined;
  };

  const add = () => {
    const finalNotes = buildNotes();
    const key = [
      item.id,
      `s${sizeIndex}`,
      `v${variantIndex}`,
      item.addOns.map((_, i) => addonQty[i] ?? 0).join("-"),
      finalNotes ?? "",
    ].join("|");
    onAdd({
      key,
      menuItemId: item.id,
      name: variant ? `${item.name} (${variant.name})` : item.name,
      unitPrice,
      quantity,
      notes: finalNotes,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="top-10 max-w-xl translate-y-0 gap-0 p-0">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 pr-12">
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt=""
              className="size-14 shrink-0 rounded-xl object-cover"
            />
          )}
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-ink">
              {item.name}
            </h2>
            {item.description && (
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            )}
            <p className="mt-0.5 font-semibold text-ink">{formatMoney(item.price)}</p>
          </div>
        </div>

        <div className="space-y-3.5 px-4 pb-4">
          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-ink">Quantity</span>
            <Stepper
              value={quantity}
              onDec={() => setQuantity((q) => Math.max(1, q - 1))}
              onInc={() => setQuantity((q) => q + 1)}
              min={1}
            />
          </div>

          {/* Size */}
          {item.sizes.length > 0 && (
            <OptionGroup
              title="Choose A Size"
              options={item.sizes}
              selectedIndex={sizeIndex}
              onSelect={setSizeIndex}
            />
          )}

          {/* Variant / filling */}
          {item.variants.length > 0 && (
            <OptionGroup
              title="Choose A Filling"
              options={item.variants}
              selectedIndex={variantIndex}
              onSelect={setVariantIndex}
            />
          )}

          {/* Addons */}
          {item.addOns.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Addons</p>
              <div className="grid grid-cols-2 gap-2">
                {item.addOns.map((a, i) => (
                  <div
                    key={`${a.name}-${i}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {a.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(a.price)}
                      </p>
                    </div>
                    <Stepper
                      value={addonQty[i] ?? 0}
                      onDec={() => setAddon(i, -1)}
                      onInc={() => setAddon(i, 1)}
                      min={0}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special instructions */}
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Special Instructions</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add note (extra mayo, cheese, etc.)"
              rows={2}
              className="w-full resize-none rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <Button className="h-12 w-full text-base" onClick={add}>
            Add to Cart · {formatMoney(unitPrice * quantity)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OptionGroup({
  title,
  options,
  selectedIndex,
  onSelect,
}: {
  title: string;
  options: MenuOptionRow[];
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => {
          const active = selectedIndex === i;
          return (
            <button
              key={`${o.name}-${i}`}
              type="button"
              onClick={() => onSelect(i)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                active
                  ? "border-brand bg-brand-tint/40"
                  : "border-border bg-card hover:border-brand/40",
              )}
            >
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-full border",
                  active ? "border-brand" : "border-muted-foreground/40",
                )}
              >
                {active && <span className="size-2 rounded-full bg-brand" />}
              </span>
              <span className="text-sm font-medium text-ink">{o.name}</span>
              {o.price > 0 && (
                <span className="text-xs text-muted-foreground">
                  +{formatMoney(o.price)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stepper({
  value,
  onDec,
  onInc,
  min = 0,
  compact = false,
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
  min?: number;
  compact?: boolean;
}) {
  const size = compact ? "size-7" : "size-9";
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Decrease"
        onClick={onDec}
        disabled={value <= min}
        className={cn(
          "flex items-center justify-center rounded-full border border-brand text-brand transition-colors hover:bg-brand-tint/50 disabled:opacity-40",
          size,
        )}
      >
        <Minus className={compact ? "size-3.5" : "size-4"} />
      </button>
      <span className={cn("text-center font-medium", compact ? "w-4 text-sm" : "w-6")}>
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase"
        onClick={onInc}
        className={cn(
          "flex items-center justify-center rounded-full border border-brand text-brand transition-colors hover:bg-brand-tint/50",
          size,
        )}
      >
        <Plus className={compact ? "size-3.5" : "size-4"} />
      </button>
    </div>
  );
}
