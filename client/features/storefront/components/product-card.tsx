"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useHydrated } from "@/hooks/use-hydrated";
import type { MenuItem, MenuTag } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const TAG_LABELS: Record<MenuTag, string> = {
  popular: "Popular",
  new: "New",
  vegetarian: "Veg",
  vegan: "Vegan",
  "gluten-free": "GF",
  spicy: "Spicy",
  "chef-special": "Chef's",
};

/** Tags worth surfacing as a highlighted ribbon on the image. */
const RIBBON_TAG: Partial<Record<MenuTag, string>> = {
  popular: "Popular",
  new: "New",
  "chef-special": "Chef's pick",
};

interface ProductCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

/** Compact, mobile-first product tile (foodpanda shop style). */
export function ProductCard({ item, onAdd }: ProductCardProps) {
  const ribbon = item.tags.map((t) => RIBBON_TAG[t]).find(Boolean);
  const hasModifiers = item.modifiers.length > 0;

  const cartItems = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const hydrated = useHydrated();

  // The plain (unmodified) cart line for this item — what the stepper controls.
  const baseLine = cartItems.find(
    (i) => i.menuItemId === item.id && i.modifiers.length === 0 && !i.notes,
  );
  const qty = hydrated ? baseLine?.quantity ?? 0 : 0;

  const decrement = () => {
    if (!baseLine) return;
    if (qty <= 1) removeItem(baseLine.id);
    else updateQuantity(baseLine.id, qty - 1);
  };

  return (
    <motion.article
      layout
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]",
        !item.isAvailable && "opacity-60",
      )}
    >
      {/* Stretched link — whole card opens the details page. */}
      <Link href={`/menu/${item.id}`} className="absolute inset-0 z-0" aria-label={item.name}>
        <span className="sr-only">{item.name}</span>
      </Link>

      <div className="relative aspect-square w-full overflow-hidden bg-subtle">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          className={cn(
            "object-cover transition-transform duration-500 group-hover:scale-105",
            !item.isAvailable && "grayscale",
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {ribbon && item.isAvailable && (
          <span className="absolute left-0 top-2 rounded-r-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-sm">
            {ribbon}
          </span>
        )}

        {!item.isAvailable && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-white">
            Sold out
          </span>
        )}

        {/* Add button → quantity stepper once the item is in the cart */}
        {qty > 0 && item.isAvailable ? (
          <div className="absolute bottom-2 right-2 z-10 flex items-center gap-0.5 rounded-full bg-brand p-1 text-primary-foreground shadow-md">
            <button
              type="button"
              onClick={decrement}
              aria-label={`Decrease ${item.name}`}
              className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-white/20"
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-[1.25rem] text-center text-sm font-semibold">{qty}</span>
            <button
              type="button"
              onClick={() => onAdd(item)}
              aria-label={`Increase ${item.name}`}
              className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-white/20"
            >
              <Plus className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!item.isAvailable}
            onClick={() => onAdd(item)}
            aria-label={hasModifiers ? `Customize ${item.name}` : `Add ${item.name}`}
            className="absolute bottom-2 right-2 z-10 flex size-9 items-center justify-center rounded-full bg-brand text-primary-foreground shadow-md transition-transform hover:bg-brand-hover active:scale-90 disabled:pointer-events-none disabled:opacity-50"
          >
            <Plus className="size-5" />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-ink">{item.name}</h3>
        <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
          {item.description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
          <span className="text-sm font-semibold text-ink">{formatCurrency(item.price)}</span>
          {item.tags.length > 0 && (
            <span className="truncate text-[10px] font-medium text-muted-foreground">
              {item.tags
                .slice(0, 2)
                .map((t) => TAG_LABELS[t])
                .join(" · ")}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
