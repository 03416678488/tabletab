"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductHeroMedia } from "@/components/menu/product-hero-media";
import { motion } from "framer-motion";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { useVenueStore } from "@/hooks/use-venue-store";
import { toast } from "@/hooks/use-toast";
import type { CartItemModifier, MenuItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TAG_LABELS: Record<string, string> = {
  popular: "Popular",
  new: "New",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  "gluten-free": "Gluten-free",
  spicy: "Spicy",
  "chef-special": "Chef's special",
};

interface ProductViewProps {
  item: MenuItem;
  token: string;
}

export function ProductView({ item, token }: ProductViewProps) {
  const router = useRouter();
  const addItem = useVenueStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState("");

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
    return result;
  }, [item, selected]);

  const unitPrice = item.price + modifiers.reduce((s, m) => s + m.priceDelta, 0);
  const lineTotal = unitPrice * quantity;

  const missingRequired = item.modifiers
    .filter((g) => g.required && !(selected[g.id]?.length))
    .map((g) => g.label);

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
    if (missingRequired.length > 0) return;
    addItem({
      menuItemId: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      unitPrice: item.price,
      quantity,
      modifiers,
      notes: notes.trim() || undefined,
    });
    toast(`Added ${item.name}`, { tone: "success", duration: 2500 });
    router.push(`/t/${token}`);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-surface"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
    >
      <div className="relative aspect-[4/3] w-full shrink-0">
        <ProductHeroMedia item={item} className="absolute inset-0 h-full w-full" priority showGradient />
        <Button
          variant="secondary"
          size="icon"
          className="absolute left-4 top-4 z-10 size-10 rounded-full bg-surface/90 shadow-md backdrop-blur-sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-5">
        <div className="mx-auto max-w-lg">
          <h1 className="font-display text-2xl font-bold text-ink">{item.name}</h1>
          <p className="mt-1 text-xl font-semibold text-brand">{formatCurrency(item.price)}</p>

          {item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <StatusPill key={tag} tone="brand" dot={false}>
                  {TAG_LABELS[tag] ?? tag}
                </StatusPill>
              ))}
            </div>
          )}

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.description}</p>

          {item.modifiers.map((group) => (
            <div key={group.id} className="mt-6">
              <p className="font-display text-sm font-semibold text-ink">
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
                        "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors",
                        checked ? "border-brand bg-brand-tint" : "border-border bg-surface",
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

          <div className="mt-6">
            <label htmlFor="venue-notes" className="text-sm font-semibold text-ink">
              Special instructions
            </label>
            <textarea
              id="venue-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. no onions, allergy note…"
              rows={2}
              className="mt-2 w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm shadow-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <div className="mt-6 flex items-center justify-center gap-5">
            <Button
              variant="outline"
              size="icon"
              className="size-11 rounded-full"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus className="size-4" />
            </Button>
            <span className="min-w-[2ch] text-center text-xl font-bold">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="size-11 rounded-full"
              onClick={() => setQuantity((q) => q + 1)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/95 p-4 backdrop-blur-md">
        <div className="mx-auto max-w-lg">
          <Button
            className="w-full"
            size="lg"
            disabled={missingRequired.length > 0}
            onClick={handleAdd}
          >
            Add to cart · {formatCurrency(lineTotal)}
          </Button>
          {missingRequired.length > 0 && (
            <p className="mt-2 text-center text-xs text-destructive">
              Select: {missingRequired.join(", ")}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
