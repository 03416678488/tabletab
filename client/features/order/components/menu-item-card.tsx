"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import type { MenuItem } from "@/lib/types";
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

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  const hasModifiers = item.modifiers.length > 0;

  return (
    <motion.article
      layout
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "flex gap-3 rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)] sm:gap-4 sm:p-4",
        !item.isAvailable && "opacity-60",
      )}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-subtle sm:size-28">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 80px, 112px"
        />
        {!item.isAvailable && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[11px] font-semibold uppercase tracking-wide text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-display font-semibold leading-snug text-ink">{item.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground sm:text-sm">
          {item.description}
        </p>
        {item.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {item.tags.slice(0, 2).map((tag) => (
              <StatusPill key={tag} tone="neutral" dot={false} className="px-2 text-[10px]">
                {TAG_LABELS[tag] ?? tag}
              </StatusPill>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <span className="font-semibold text-ink">{formatCurrency(item.price)}</span>
          <Button
            size="sm"
            variant={hasModifiers ? "outline" : "default"}
            disabled={!item.isAvailable}
            onClick={() => onAdd(item)}
            className="shrink-0 rounded-full"
          >
            <Plus className="size-4" />
            {hasModifiers ? "Customize" : "Add"}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
