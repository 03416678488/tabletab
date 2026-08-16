"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { BadgePercent, ChevronLeft, ChevronRight } from "lucide-react";

import { AppImage } from "@/components/ui/app-image";
import { cn, formatCurrency } from "@/lib/utils";
import { useActivePromotions } from "@/features/promotion/hooks/use-active-promotions";
import type { Promotion } from "@/features/promotion/types/promotion.types";

/** Discount seal text, e.g. "30% OFF" or "$5 OFF". */
function discountBadge(p: Promotion): string {
  if (!p.discountValue) return "OFFER";
  return p.discountType === "percentage"
    ? `${p.discountValue}% OFF`
    : `${formatCurrency(p.discountValue)} OFF`;
}

/**
 * Featured highlights — driven by live promotions (active + within their
 * window). Portrait cards, swipeable, with arrows + dot pagination. Renders
 * nothing when there are no active promotions.
 */
export function FeaturedCarousel() {
  const { promotions } = useActivePromotions();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const itemStep = () => {
    const el = scrollRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    return first ? first.offsetWidth + 16 : 1; // card width + gap-4
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (el) setActive(Math.round(el.scrollLeft / itemStep()));
  };

  const goto = (i: number) => {
    const clamped = Math.max(0, Math.min(promotions.length - 1, i));
    scrollRef.current?.scrollTo({ left: clamped * itemStep(), behavior: "smooth" });
  };

  // Nothing live to feature → hide the section entirely.
  if (promotions.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <h2 className="mb-4 font-display text-xl font-bold text-ink sm:text-2xl">Featured picks</h2>

      <div className="relative">
        {/* Arrows (desktop) */}
        <button
          type="button"
          onClick={() => goto(active - 1)}
          aria-label="Previous"
          className="absolute -left-3 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-[var(--shadow-elevated)] transition-colors hover:bg-secondary sm:flex"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => goto(active + 1)}
          aria-label="Next"
          className="absolute -right-3 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-[var(--shadow-elevated)] transition-colors hover:bg-secondary sm:flex"
        >
          <ChevronRight className="size-5" />
        </button>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {promotions.map((promo) => {
            const badge = discountBadge(promo);
            return (
              <Link
                key={promo.id}
                href={`/promotion/${promo.slug}`}
                className="group relative aspect-[3/4] w-56 shrink-0 snap-start overflow-hidden rounded-2xl shadow-[var(--shadow-card)] sm:w-64"
              >
                <AppImage
                  src={promo.imageUrl ?? ""}
                  alt={promo.title}
                  fill
                  fallbackIcon={BadgePercent}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 224px, 256px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />

                <span className="absolute right-3 top-3 flex size-14 flex-col items-center justify-center rounded-full bg-accent text-center font-bold uppercase leading-none text-white shadow-md">
                  <span className="text-sm">{badge.split(" ")[0]}</span>
                  {badge.split(" ")[1] && <span className="text-[9px]">{badge.split(" ")[1]}</span>}
                </span>

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-display text-lg font-bold leading-tight text-white drop-shadow">
                    {promo.title}
                  </h3>
                  {promo.products && promo.products.length > 0 && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-white/80">
                      {promo.products.map((pr) => pr.name).join(", ")}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Dot pagination */}
      <div className="mt-4 flex items-center justify-center gap-1.5">
        {promotions.map((promo, i) => (
          <button
            key={promo.id}
            type="button"
            onClick={() => goto(i)}
            aria-label={`Go to ${promo.title}`}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === active ? "w-6 bg-brand" : "w-1.5 bg-border hover:bg-muted-foreground/40",
            )}
          />
        ))}
      </div>
    </section>
  );
}
