"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { api } from "@/lib/api";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { EmblaSlider } from "@/features/website-builder/render/embla-slider";
import type {
  CategoryGridConfig,
  FeaturedCategoriesConfig,
  ProductCarouselConfig,
} from "@/features/website-builder/schemas/blocks";

const shell = "mx-auto max-w-6xl px-4 sm:px-6";

/** Shared product-card presentation used by product/category blocks. */
function ProductCard({ item }: { item: MenuItem }) {
  return (
    <Link href="/order" className="group block">
      <span className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-subtle shadow-[var(--shadow-card)]">
        {item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="200px"
          />
        )}
      </span>
      <p className="mt-2 line-clamp-1 text-sm font-semibold text-ink">{item.name}</p>
      <p className="text-sm text-brand">{formatCurrency(item.price)}</p>
    </Link>
  );
}

function categoryThumb(cat: MenuCategory, items: MenuItem[]): string {
  return (
    items.find((i) => i.categoryId === cat.id)?.imageUrl ??
    `https://picsum.photos/seed/${cat.id}/300/300`
  );
}

export function CategoryGridRender({ config }: { config: CategoryGridConfig }) {
  const [cats, setCats] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    let off = false;
    Promise.all([api.getCategories(), api.getMenuItems()]).then(([c, m]) => {
      if (off) return;
      setCats([...c].sort((a, b) => a.sortOrder - b.sortOrder));
      setItems(m);
    });
    return () => {
      off = true;
    };
  }, []);

  const shown = cats.slice(0, config.limit);
  const card = (cat: MenuCategory) => (
    <Link href="/order" className="group flex flex-col items-center gap-2">
      <span className="relative aspect-square w-full overflow-hidden rounded-2xl bg-subtle shadow-[var(--shadow-card)] transition-transform group-hover:-translate-y-1">
        <Image
          src={categoryThumb(cat, items)}
          alt={cat.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="200px"
        />
      </span>
      <span className="line-clamp-2 text-center text-sm font-semibold leading-tight text-brand">
        {cat.name}
      </span>
    </Link>
  );

  return (
    <section className={cn(shell, "py-4")}>
      {config.title && (
        <h2 className="mb-4 font-display text-xl font-bold text-ink sm:text-2xl">{config.title}</h2>
      )}
      {/* Fixed tile width (not fractional) so the slider and grid layouts render
          at exactly the same size — ~20% smaller than the previous slider tiles. */}
      {config.layout === "slider" ? (
        <EmblaSlider slideClassName="basis-36 sm:basis-44">
          {shown.map((cat) => (
            <div key={cat.id}>{card(cat)}</div>
          ))}
        </EmblaSlider>
      ) : (
        <div className="flex flex-wrap gap-4">
          {shown.map((cat) => (
            <div key={cat.id} className="w-36 sm:w-44">
              {card(cat)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function FeaturedCategoriesRender({ config }: { config: FeaturedCategoriesConfig }) {
  const [cats, setCats] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    let off = false;
    Promise.all([api.getCategories(), api.getMenuItems()]).then(([c, m]) => {
      if (off) return;
      setCats(c);
      setItems(m);
    });
    return () => {
      off = true;
    };
  }, []);

  const byId = new Map(cats.map((c) => [c.id, c]));
  // Preserve the author's chosen order; skip categories that no longer exist.
  const selected = config.categoryIds
    .map((id) => byId.get(id))
    .filter((c): c is MenuCategory => Boolean(c));

  if (selected.length === 0) return null;

  return (
    <section className={cn(shell, "space-y-6 py-4")}>
      {config.title && (
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">{config.title}</h2>
      )}
      {selected.map((cat) => {
        const catItems = items.filter((i) => i.categoryId === cat.id).slice(0, config.limit);
        if (catItems.length === 0) return null;
        return (
          <div key={cat.id}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-bold text-ink">{cat.name}</h3>
              {config.showViewAll && (
                <Link
                  href="/order"
                  className="inline-flex items-center gap-0.5 text-sm font-medium text-brand hover:underline"
                >
                  View all <ChevronRight className="size-4" />
                </Link>
              )}
            </div>
            {config.layout === "slider" ? (
              <EmblaSlider slideClassName="basis-1/2 sm:basis-1/4">
                {catItems.map((item) => (
                  <div key={item.id}>
                    <ProductCard item={item} />
                  </div>
                ))}
              </EmblaSlider>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {catItems.map((item) => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

export function ProductCarouselRender({ config }: { config: ProductCarouselConfig }) {
  const [items, setItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    let off = false;
    api.getMenuItems().then((m) => {
      if (off) return;
      setItems(m);
    });
    return () => {
      off = true;
    };
  }, []);

  const filtered =
    config.source === "popular"
      ? items.filter((i) => i.tags.includes("popular"))
      : items.filter((i) => i.categoryId === config.source);
  const shown = (filtered.length ? filtered : items).slice(0, config.limit);

  return (
    <section className={cn(shell, "py-4")}>
      {config.title && (
        <h2 className="mb-4 font-display text-lg font-bold text-ink sm:text-xl">{config.title}</h2>
      )}
      {config.layout === "slider" ? (
        <EmblaSlider slideClassName="basis-1/2 sm:basis-1/4">
          {shown.map((item) => (
            <div key={item.id}>
              <ProductCard item={item} />
            </div>
          ))}
        </EmblaSlider>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
