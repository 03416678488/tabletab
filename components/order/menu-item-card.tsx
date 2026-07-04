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
        "flex gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]",
        !item.isAvailable && "opacity-60",
      )}
    >
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-subtle sm:size-28">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          className="object-cover"
          sizes="112px"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-ink">{item.name}</h3>
          <span className="shrink-0 font-medium text-ink">{formatCurrency(item.price)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        {item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.tags.slice(0, 3).map((tag) => (
              <StatusPill key={tag} tone="neutral" dot={false} className="text-[10px] px-2">
                {TAG_LABELS[tag] ?? tag}
              </StatusPill>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          {!item.isAvailable ? (
            <span className="text-xs font-medium text-muted-foreground">Sold out</span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {hasModifiers ? "Customize available" : ""}
            </span>
          )}
          <Button
            size="sm"
            variant={hasModifiers ? "outline" : "default"}
            disabled={!item.isAvailable}
            onClick={() => onAdd(item)}
          >
            <Plus className="size-4" />
            {hasModifiers ? "Customize" : "Add"}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
