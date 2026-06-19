"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { BuffetPickerSheet } from "@/components/order/buffet-picker-sheet";
import { MenuItemRow } from "@/components/venue/menu-item-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useVenueStore } from "@/hooks/use-venue-store";
import { api } from "@/lib/api";
import { formatBuffetSummary } from "@/lib/buffet-utils";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface VenueMenuProps {
  token: string;
}

export function VenueMenu({ token }: VenueMenuProps) {
  const branchId = useVenueStore((s) => s.branchId);
  const buffet = useVenueStore((s) => s.buffet);
  const setBuffet = useVenueStore((s) => s.setBuffet);
  const setCartOpen = useVenueStore((s) => s.setCartOpen);
  const [buffetOpen, setBuffetOpen] = useState(false);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const chipsRef = useRef<HTMLDivElement>(null);
  const scrollingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, menu] = await Promise.all([api.getCategories(), api.getMenuItems()]);
        if (!cancelled) {
          const sorted = [...cats].sort((a, b) => a.sortOrder - b.sortOrder);
          setCategories(sorted);
          setItems(menu);
          setActiveCategory(sorted[0]?.id ?? "");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!categories.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          const id = visible[0].target.id.replace("cat-", "");
          setActiveCategory(id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5] },
    );

    for (const cat of categories) {
      const el = sectionRefs.current[cat.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [categories, items]);

  const scrollToCategory = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    const el = sectionRefs.current[categoryId];
    if (el) {
      scrollingRef.current = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        scrollingRef.current = false;
      }, 600);
    }
    const chip = chipsRef.current?.querySelector(`[data-cat="${categoryId}"]`);
    chip?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 px-4 py-4">
        <Skeleton className="h-10 w-full rounded-full" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-28">
      <div
        ref={chipsRef}
        className="sticky top-14 z-30 -mx-0 flex gap-2 overflow-x-auto border-b border-border/60 bg-subtle/95 px-4 py-3 backdrop-blur-sm scrollbar-none"
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            data-cat={cat.id}
            onClick={() => scrollToCategory(cat.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activeCategory === cat.id
                ? "bg-brand text-primary-foreground shadow-sm"
                : "bg-surface text-muted-foreground ring-1 ring-border hover:text-ink",
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="space-y-8 px-4 pt-4">
        {branchId && (
          <Card className="border-amber-200/80 bg-accent-tint/30">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-display font-semibold text-ink">Buffet dining</p>
                <p className="text-sm text-muted-foreground">Per-head packages available now.</p>
                {buffet && (
                  <p className="mt-1 text-sm text-brand-deep">
                    {formatBuffetSummary(buffet)} · {formatCurrency(buffet.subtotal)}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBuffetOpen(true)}
              >
                <UtensilsCrossed className="size-4" />
                {buffet ? "Change" : "Add buffet"}
              </Button>
            </CardContent>
          </Card>
        )}

        {categories.map((cat) => {
          const catItems = items.filter((i) => i.categoryId === cat.id);
          if (catItems.length === 0) return null;
          return (
            <section
              key={cat.id}
              id={`cat-${cat.id}`}
              ref={(el) => {
                sectionRefs.current[cat.id] = el;
              }}
              className="scroll-mt-32"
            >
              <h2 className="mb-3 font-display text-lg font-bold text-ink">{cat.name}</h2>
              {cat.description && (
                <p className="mb-3 text-xs text-muted-foreground">{cat.description}</p>
              )}
              <div className="space-y-3">
                {catItems.map((item) => (
                  <MenuItemRow key={item.id} item={item} token={token} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {branchId && (
        <BuffetPickerSheet
          open={buffetOpen}
          onOpenChange={setBuffetOpen}
          branchId={branchId}
          initialSelection={buffet}
          onConfirm={(selection) => {
            setBuffet(selection);
            setCartOpen(true);
          }}
        />
      )}
    </div>
  );
}
