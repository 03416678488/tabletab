"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { formatCurrency, isLocalUpload } from "@/lib/utils";

interface MenuHighlightsProps {
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
}

// Tags that make an item worth surfacing at the top of the menu.
const HIGHLIGHT_TAGS = new Set(["popular", "chef-special", "new"]);

/**
 * Swipeable image slider of highlighted dishes shown above the menu list.
 * Prefers items tagged popular / chef-special / new, falling back to the first
 * available items so the slider always has something to show. Tapping a card
 * adds it to the cart (or opens the customise sheet, via `onAdd`).
 */
export function MenuHighlights({ items, onAdd }: MenuHighlightsProps) {
  const highlights = useMemo(() => {
    const available = items.filter((i) => i.isAvailable);
    const tagged = available.filter((i) => i.tags.some((t) => HIGHLIGHT_TAGS.has(t)));
    const pool = tagged.length >= 3 ? tagged : available;
    return pool.slice(0, 10);
  }, [items]);

  if (highlights.length < 3) return null;

  return (
    <section className="mb-4 sm:mb-5">
      <h2 className="mb-2.5 font-display text-base font-semibold text-ink sm:text-lg">
        Popular right now
      </h2>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {highlights.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onAdd(item)}
            className="group relative h-28 w-52 shrink-0 snap-start overflow-hidden rounded-2xl text-left shadow-[var(--shadow-card)] sm:h-32 sm:w-56"
          >
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 208px, 224px"
              unoptimized={isLocalUpload(item.imageUrl)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />

            <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2 py-0.5 text-xs font-bold text-ink shadow-sm">
              {formatCurrency(item.price)}
            </span>

            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5">
              <span className="line-clamp-2 font-display text-sm font-semibold leading-tight text-white drop-shadow">
                {item.name}
              </span>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-primary-foreground shadow-md transition-transform group-active:scale-90">
                <Plus className="size-4" />
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
