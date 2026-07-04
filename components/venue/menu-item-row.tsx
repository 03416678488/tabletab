"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import type { MenuItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TAG_LABELS: Record<string, string> = {
  popular: "Popular",
  new: "New",
  vegetarian: "Veg",
  vegan: "Vegan",
  "gluten-free": "GF",
  spicy: "Spicy",
  "chef-special": "Special",
};

interface MenuItemRowProps {
  item: MenuItem;
  token: string;
}

export function MenuItemRow({ item, token }: MenuItemRowProps) {
  const disabled = !item.isAvailable;

  const content = (
    <article
      className={cn(
        "flex gap-3 rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-card)] transition-all",
        !disabled && "active:scale-[0.99] hover:shadow-[var(--shadow-elevated)]",
        disabled && "opacity-55",
      )}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-subtle">
        <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="80px" />
        {disabled && (
          <span className="absolute inset-0 flex items-center justify-center bg-ink/50 text-[10px] font-bold uppercase tracking-wide text-white">
            Sold out
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[15px] font-semibold leading-tight text-ink">
            {item.name}
          </h3>
          <span className="shrink-0 text-sm font-semibold text-brand">
            {formatCurrency(item.price)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {item.description}
        </p>
        {item.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <StatusPill key={tag} tone="neutral" dot={false} className="px-1.5 py-0 text-[9px]">
                {TAG_LABELS[tag] ?? tag}
              </StatusPill>
            ))}
          </div>
        )}
      </div>
      {!disabled && <ChevronRight className="size-4 shrink-0 self-center text-muted-foreground" />}
    </article>
  );

  if (disabled) return content;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <Link
        href={`/t/${token}/item/${item.id}`}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-2xl"
      >
        {content}
      </Link>
    </motion.div>
  );
}
