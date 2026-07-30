"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&h=800&q=70`;

interface Feature {
  id: string;
  title: string;
  image: string;
  href: string;
  /** Optional discount seal, e.g. "20% OFF". */
  badge?: string;
}

const FEATURES: Feature[] = [
  { id: "best-seller", title: "Best seller", image: unsplash("1568901346375-23c9450c58cd"), href: "/order" },
  { id: "limited", title: "Limited time offer", image: unsplash("1517248135467-4c7edcad34c4"), href: "/order" },
  { id: "chicken-burger", title: "Grilled Chicken Burger", image: unsplash("1598103442097-8b74394b95c6"), href: "/order", badge: "20% OFF" },
  { id: "margherita", title: "Wood-fired Margherita", image: unsplash("1574071318508-1cdbab80d002"), href: "/order", badge: "15% OFF" },
  { id: "chef", title: "Chef's special", image: unsplash("1600891964092-4316c288032e"), href: "/order" },
  { id: "sweets", title: "Sweet endings", image: unsplash("1551024601-bec78aea704b"), href: "/order" },
  { id: "family", title: "Family feast", image: unsplash("1504674900247-0877df9cc836"), href: "/order", badge: "Bundle" },
  { id: "free-delivery", title: "Free delivery", image: unsplash("1526367790999-0150786686a2"), href: "/order" },
];

/** Featured highlights — portrait cards, swipeable, with arrows + dot pagination. */
export function FeaturedCarousel() {
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
    const clamped = Math.max(0, Math.min(FEATURES.length - 1, i));
    scrollRef.current?.scrollTo({ left: clamped * itemStep(), behavior: "smooth" });
  };

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
          {FEATURES.map((feature) => (
            <Link
              key={feature.id}
              href={feature.href}
              className="group relative aspect-[3/4] w-56 shrink-0 snap-start overflow-hidden rounded-2xl shadow-[var(--shadow-card)] sm:w-64"
            >
              <Image
                src={feature.image}
                alt={feature.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 224px, 256px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />

              {feature.badge && (
                <span className="absolute right-3 top-3 flex size-14 flex-col items-center justify-center rounded-full bg-accent text-center font-bold uppercase leading-none text-white shadow-md">
                  <span className="text-sm">{feature.badge.split(" ")[0]}</span>
                  {feature.badge.split(" ")[1] && (
                    <span className="text-[9px]">{feature.badge.split(" ")[1]}</span>
                  )}
                </span>
              )}

              <h3 className="absolute inset-x-0 bottom-0 p-4 font-display text-lg font-bold leading-tight text-white drop-shadow">
                {feature.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>

      {/* Dot pagination */}
      <div className="mt-4 flex items-center justify-center gap-1.5">
        {FEATURES.map((feature, i) => (
          <button
            key={feature.id}
            type="button"
            onClick={() => goto(i)}
            aria-label={`Go to ${feature.title}`}
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
