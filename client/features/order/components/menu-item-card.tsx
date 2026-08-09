"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import type { MenuItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TAG_LABELS: Record<string, string> = {
  popular: "Popular",
  new: "New",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  "gluten-free": "GF",
  spicy: "Spicy",
  "chef-special": "Chef's",
};

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  /** "row" = compact horizontal list row; "grid" = vertical card (2-up grid). */
  variant?: "row" | "grid";
}

/**
 * Menu item card. `row` is a compact horizontal list row; `grid` is a vertical
 * card (image on top) for a 2-per-row grid. Both keep the round add button on the
 * thumbnail corner; items with modifiers open the customize sheet on tap.
 */
export function MenuItemCard({ item, onAdd, variant = "row" }: MenuItemCardProps) {
  const hasModifiers = item.modifiers.length > 0;
  const tag = item.tags[0];

  const addBtn = (posClass: string) => (
    <button
      type="button"
      onClick={() => onAdd(item)}
      disabled={!item.isAvailable}
      aria-label={hasModifiers ? `Customize ${item.name}` : `Add ${item.name}`}
      className={cn(
        "absolute flex size-7 items-center justify-center rounded-full border-2 border-surface shadow-md transition-transform active:scale-90 disabled:opacity-40",
        hasModifiers
          ? "bg-surface text-brand ring-1 ring-brand"
          : "bg-brand text-primary-foreground",
        posClass,
      )}
    >
      <Plus className="size-4" />
    </button>
  );

  const soldOut = !item.isAvailable && (
    <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[10px] font-semibold uppercase tracking-wide text-white">
      Sold out
    </span>
  );

  const tagBadge = tag && (
    <StatusPill
      tone="neutral"
      dot={false}
      className="shrink-0 px-1.5 py-0 text-[9px] font-medium uppercase tracking-wide"
    >
      {TAG_LABELS[tag] ?? tag}
    </StatusPill>
  );

  // --- Grid (vertical) variant -------------------------------------------------
  if (variant === "grid") {
    return (
      <motion.article
        layout
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(
          "flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]",
          !item.isAvailable && "opacity-60",
        )}
      >
        <div className="relative aspect-[3/2] w-full bg-subtle">
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="50vw" />
          {soldOut}
          {tag && <span className="absolute left-2 top-2">{tagBadge}</span>}
          {/* Add button on the image's bottom-right corner */}
          {addBtn("bottom-2 right-2")}
        </div>
        <div className="flex flex-1 flex-col p-2">
          <h3 className="line-clamp-1 text-[13px] font-semibold leading-tight text-ink">
            {item.name}
          </h3>
          <span className="mt-0.5 text-[13px] font-semibold text-ink">
            {formatCurrency(item.price)}
          </span>
        </div>
      </motion.article>
    );
  }

  // --- Row (horizontal) variant ------------------------------------------------
  return (
    <motion.article
      layout
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-border bg-surface p-2.5 shadow-[var(--shadow-card)]",
        !item.isAvailable && "opacity-60",
      )}
    >
      <div className="relative size-16 shrink-0 sm:size-[4.5rem]">
        <div className="size-full overflow-hidden rounded-xl bg-subtle">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 64px, 72px"
          />
          {soldOut}
        </div>
        {addBtn("-bottom-2 -right-2")}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5">
          <h3 className="min-w-0 flex-1 truncate font-semibold leading-snug text-ink">
            {item.name}
          </h3>
          {tagBadge}
        </div>
        {item.description && (
          <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-muted-foreground">
            {item.description}
          </p>
        )}
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-sm font-semibold text-ink">{formatCurrency(item.price)}</span>
          {hasModifiers && (
            <span className="text-[11px] text-muted-foreground">· customizable</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
