"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, UtensilsCrossed } from "lucide-react";

import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/ui/status-pill";
import { useCart } from "@/hooks/use-cart";
import { useLocationStore } from "@/hooks/use-location-store";
import { toast } from "@/hooks/use-toast";
import type { CartItemModifier, MenuItem, MenuTag } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const TAG_LABELS: Record<MenuTag, string> = {
  popular: "Popular",
  new: "New",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  "gluten-free": "Gluten-free",
  spicy: "Spicy",
  "chef-special": "Chef's special",
};

interface ProductDetailsDialogProps {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Storefront "customise & add" dialog. Mirrors the item details page's options
 * (size / variant / add-ons / modifier groups / notes) so an item can be added
 * to the cart with all its choices without leaving the current page.
 */
export function ProductDetailsDialog({ item, open, onOpenChange }: ProductDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg gap-0 overflow-hidden p-0">
        {/* Keyed so the form fully resets whenever a different item is opened. */}
        {item && <DialogBody key={item.id} item={item} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function DialogBody({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const addItem = useCart((s) => s.addItem);
  const setCartBranch = useCart((s) => s.setBranch);
  const cartBranchId = useCart((s) => s.branchId);
  const locationBranchId = useLocationStore((s) => s.branchId);

  const sizes = item.sizes ?? [];
  const variants = item.variants ?? [];
  const addOns = item.addOns ?? [];

  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [sizeIndex, setSizeIndex] = useState(sizes.length > 0 ? 0 : -1);
  const [variantIndex, setVariantIndex] = useState(variants.length > 0 ? 0 : -1);
  const [addonQty, setAddonQty] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState("");

  // Guard against a stale form if the same component is reused (belt & braces —
  // the parent already keys us by item id).
  useEffect(() => {
    setQuantity(1);
    setSelected({});
    setSizeIndex(sizes.length > 0 ? 0 : -1);
    setVariantIndex(variants.length > 0 ? 0 : -1);
    setAddonQty({});
    setNotes("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const size = sizeIndex >= 0 ? sizes[sizeIndex] : undefined;
  const variant = variantIndex >= 0 ? variants[variantIndex] : undefined;

  const modifiers: CartItemModifier[] = useMemo(() => {
    const result: CartItemModifier[] = [];
    for (const group of item.modifiers) {
      for (const optId of selected[group.id] ?? []) {
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
    if (size) {
      result.push({ groupId: "size", optionId: `size:${sizeIndex}`, label: `Size: ${size.name}`, priceDelta: size.price });
    }
    if (variant) {
      result.push({ groupId: "variant", optionId: `variant:${variantIndex}`, label: variant.name, priceDelta: variant.price });
    }
    addOns.forEach((a, i) => {
      const q = addonQty[i] ?? 0;
      if (q > 0) {
        result.push({ groupId: "addon", optionId: `addon:${i}`, label: q > 1 ? `${a.name} ×${q}` : a.name, priceDelta: a.price * q });
      }
    });
    return result;
  }, [item.modifiers, selected, size, variant, sizeIndex, variantIndex, addOns, addonQty]);

  const unitTotal = item.price + modifiers.reduce((s, m) => s + m.priceDelta, 0);
  const missingRequired = item.modifiers
    .filter((g) => g.required && !selected[g.id]?.length)
    .map((g) => g.label);

  const toggleOption = (groupId: string, optionId: string, multiple: boolean) =>
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (multiple) {
        return {
          ...prev,
          [groupId]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      }
      return { ...prev, [groupId]: [optionId] };
    });

  const handleAdd = () => {
    if (!item.isAvailable || missingRequired.length > 0) return;
    if (!cartBranchId && locationBranchId) setCartBranch(locationBranchId);
    addItem({
      menuItemId: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      unitPrice: item.price,
      quantity,
      modifiers,
      notes: notes.trim() || undefined,
    });
    toast(`${quantity} × ${item.name} added to cart`, { tone: "success" });
    onClose();
  };

  return (
    <div className="flex max-h-[90vh] flex-col">
      {/* Hero image */}
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-subtle">
        <AppImage
          src={item.imageUrl}
          alt={item.name}
          fill
          fallbackIcon={UtensilsCrossed}
          className={cn("object-cover", !item.isAvailable && "grayscale")}
          sizes="(max-width: 640px) 100vw, 512px"
        />
      </div>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <div>
          {item.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <StatusPill key={tag} tone="brand" dot={false}>
                  {TAG_LABELS[tag]}
                </StatusPill>
              ))}
            </div>
          )}
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="font-display text-xl font-bold text-ink">{item.name}</DialogTitle>
            <span className="shrink-0 font-display text-lg font-bold text-ink">
              {formatCurrency(item.price)}
            </span>
          </div>
          {item.description && (
            <DialogDescription className="mt-1.5 leading-relaxed text-muted-foreground">
              {item.description}
            </DialogDescription>
          )}
          {!item.isAvailable && (
            <p className="mt-3 rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium text-muted-foreground">
              This dish is currently sold out.
            </p>
          )}
        </div>

        {/* Size */}
        {sizes.length > 0 && (
          <ChoiceGroup title="Choose a size">
            {sizes.map((s, i) => (
              <ChoiceChip
                key={`${s.name}-${i}`}
                active={sizeIndex === i}
                onClick={() => setSizeIndex(i)}
                label={s.name}
                priceDelta={s.price}
              />
            ))}
          </ChoiceGroup>
        )}

        {/* Variant */}
        {variants.length > 0 && (
          <ChoiceGroup title="Choose a variant">
            {variants.map((v, i) => (
              <ChoiceChip
                key={`${v.name}-${i}`}
                active={variantIndex === i}
                onClick={() => setVariantIndex(i)}
                label={v.name}
                priceDelta={v.price}
              />
            ))}
          </ChoiceGroup>
        )}

        {/* Add-ons */}
        {addOns.length > 0 && (
          <div>
            <p className="font-display font-semibold text-ink">Add-ons</p>
            <div className="mt-2.5 space-y-2">
              {addOns.map((a, i) => {
                const q = addonQty[i] ?? 0;
                return (
                  <div
                    key={`${a.name}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{a.name}</p>
                      <p className="text-xs text-muted-foreground">+{formatCurrency(a.price)}</p>
                    </div>
                    <Stepper
                      value={q}
                      min={0}
                      onDec={() => setAddonQty((p) => ({ ...p, [i]: Math.max(0, (p[i] ?? 0) - 1) }))}
                      onInc={() => setAddonQty((p) => ({ ...p, [i]: (p[i] ?? 0) + 1 }))}
                      compact
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modifier groups */}
        {item.modifiers.map((group) => (
          <div key={group.id}>
            <div className="flex items-center justify-between">
              <p className="font-display font-semibold text-ink">{group.label}</p>
              <span className="text-xs font-medium text-muted-foreground">
                {group.required ? "Required" : group.multiple ? "Optional · multiple" : "Optional"}
              </span>
            </div>
            <div className="mt-2.5 space-y-2">
              {group.options.map((opt) => {
                const checked = (selected[group.id] ?? []).includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleOption(group.id, opt.id, group.multiple)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                      checked ? "border-brand bg-brand-tint" : "border-border hover:bg-secondary",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-5 items-center justify-center border-2 transition-colors",
                          group.multiple ? "rounded-md" : "rounded-full",
                          checked ? "border-brand bg-brand text-primary-foreground" : "border-border",
                        )}
                      >
                        {checked && <span className="size-2 rounded-full bg-current" />}
                      </span>
                      {opt.label}
                    </span>
                    <span className="text-muted-foreground">
                      {opt.priceDelta > 0 ? `+${formatCurrency(opt.priceDelta)}` : "Included"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Special instructions */}
        <div>
          <label htmlFor="dialog-notes" className="font-display font-semibold text-ink">
            Special instructions
          </label>
          <textarea
            id="dialog-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Allergies, preferences…"
            rows={2}
            className="mt-2 w-full resize-none rounded-xl border border-input bg-surface px-3.5 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand/40"
          />
        </div>
      </div>

      {/* Sticky footer — quantity + add */}
      <div className="flex shrink-0 items-center gap-3 border-t border-border bg-surface p-4">
        <Stepper
          value={quantity}
          min={1}
          onDec={() => setQuantity((q) => Math.max(1, q - 1))}
          onInc={() => setQuantity((q) => q + 1)}
        />
        <Button
          size="lg"
          className="flex-1"
          disabled={!item.isAvailable || missingRequired.length > 0}
          onClick={handleAdd}
        >
          {!item.isAvailable
            ? "Sold out"
            : missingRequired.length > 0
              ? `Select ${missingRequired[0]}`
              : `Add to cart · ${formatCurrency(unitTotal * quantity)}`}
        </Button>
      </div>
    </div>
  );
}

function ChoiceGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-display font-semibold text-ink">{title}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ChoiceChip({
  active,
  onClick,
  label,
  priceDelta,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  priceDelta: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
        active ? "border-brand bg-brand-tint text-brand-deep" : "border-border hover:bg-secondary",
      )}
    >
      {label}
      {priceDelta > 0 && (
        <span className="ml-1.5 text-muted-foreground">+{formatCurrency(priceDelta)}</span>
      )}
    </button>
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
    <div className="flex items-center gap-1 rounded-full border border-border p-1">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={onDec}
        disabled={value <= min}
        className={cn(
          "flex items-center justify-center rounded-full text-ink transition-colors hover:bg-secondary disabled:opacity-40",
          size,
        )}
      >
        <Minus className={compact ? "size-3.5" : "size-4"} />
      </button>
      <span className={cn("text-center font-semibold", compact ? "min-w-[2ch] text-sm" : "min-w-[2ch]")}>
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={onInc}
        className={cn(
          "flex items-center justify-center rounded-full text-ink transition-colors hover:bg-secondary",
          size,
        )}
      >
        <Plus className={compact ? "size-3.5" : "size-4"} />
      </button>
    </div>
  );
}
