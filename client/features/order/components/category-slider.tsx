"use client";

import { useRef } from "react";
import { UtensilsCrossed } from "lucide-react";

import { AppImage } from "@/components/ui/app-image";
import type { MenuCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CategorySliderProps {
  categories: MenuCategory[];
  activeId: string | null;
  /** Called with the category id and the tapped element (for centering it). */
  onSelect: (id: string, el: HTMLElement) => void;
}

/**
 * Food-app style category nav: a horizontally scrollable rail of image chips,
 * one per menu category. The active category gets a brand ring + label. Swipe to
 * browse, tap to jump — the pattern every major food app uses on mobile.
 */
export function CategorySlider({ categories, activeId, onSelect }: CategorySliderProps) {
  const railRef = useRef<HTMLDivElement>(null);
  // Click-and-drag to scroll on desktop (mouse only — touch/trackpad keep native
  // scrolling). `moved` suppresses the click so a drag never selects a category.
  const drag = useRef({ down: false, startX: 0, scrollLeft: 0, moved: false });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !railRef.current) return;
    drag.current = {
      down: true,
      startX: e.clientX,
      scrollLeft: railRef.current.scrollLeft,
      moved: false,
    };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.down || !railRef.current) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    railRef.current.scrollLeft = drag.current.scrollLeft - dx;
  };
  const endDrag = () => {
    drag.current.down = false;
  };
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  return (
    <div
      ref={railRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onClickCapture={onClickCapture}
      className="no-scrollbar flex gap-3.5 overflow-x-auto px-4 py-3 sm:px-6 cursor-grab select-none active:cursor-grabbing"
    >
      {categories.map((cat) => {
        const active = cat.id === activeId;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={(e) => onSelect(cat.id, e.currentTarget)}
            aria-pressed={active}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5 outline-none"
          >
            <span
              className={cn(
                "relative size-16 overflow-hidden rounded-2xl bg-subtle shadow-sm ring-2 transition-all duration-200",
                active
                  ? "scale-105 ring-brand ring-offset-2 ring-offset-subtle"
                  : "ring-transparent",
              )}
            >
              <AppImage
                src={cat.imageUrl}
                alt={cat.name}
                width={64}
                height={64}
                fallbackIcon={UtensilsCrossed}
                className="size-full object-cover"
                fallbackClassName="size-full"
              />
              {!active && (
                <span className="absolute inset-0 bg-white/30 transition-opacity" aria-hidden />
              )}
            </span>
            <span
              className={cn(
                "line-clamp-2 w-full text-center text-[11px] leading-tight",
                active ? "font-semibold text-brand-deep" : "font-medium text-muted-foreground",
              )}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
