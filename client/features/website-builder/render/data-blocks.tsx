"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { api } from "@/lib/api";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { cn, formatCurrency, isLocalUpload } from "@/lib/utils";
import { EmblaSlider } from "@/features/website-builder/render/embla-slider";
import {
  fetchStorefrontMenus,
  fetchStorefrontProducts,
  type StorefrontMenu,
} from "@/features/website-builder/services/storefront-menus";
import type {
  FeaturedCategoriesConfig,
  MenuGridConfig,
  ProductCarouselConfig,
} from "@/features/website-builder/schemas/blocks";

const shell = "mx-auto max-w-6xl px-4 sm:px-6";

/** Shared product-card presentation used by product/menu blocks. */
function ProductCard({ item }: { item: MenuItem }) {
  return (
    <Link href="/order" className="group block">
      <span className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-subtle shadow-[var(--shadow-card)]">
        {item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            unoptimized={isLocalUpload(item.imageUrl)}
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

export function MenuGridRender({ config }: { config: MenuGridConfig }) {
  const [menus, setMenus] = useState<StorefrontMenu[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let off = false;
    fetchStorefrontMenus()
      .then((m) => !off && setMenus(m))
      .catch(() => !off && setMenus([]))
      .finally(() => !off && setLoaded(true));
    return () => {
      off = true;
    };
  }, []);

  // Restrict to the author's selected menus (in their order); empty = all menus.
  const selected = config.menuIds.length
    ? config.menuIds
        .map((id) => menus.find((m) => m.id === id))
        .filter((m): m is StorefrontMenu => Boolean(m))
    : menus;
  // Only show menus that actually have dishes assigned.
  const withItems = selected.filter((m) => m.items.length > 0);
  if (loaded && withItems.length === 0) return null;

  return (
    <section className={cn(shell, "space-y-6 py-4")}>
      {config.title && (
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">{config.title}</h2>
      )}
      {withItems.map((menu) => {
        const dishes = menu.items.slice(0, config.limit);
        return (
          <div key={menu.id}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-bold text-ink">{menu.name}</h3>
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
                {dishes.map((item) => (
                  <div key={item.id}>
                    <ProductCard item={item} />
                  </div>
                ))}
              </EmblaSlider>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {dishes.map((item) => (
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
    fetchStorefrontProducts()
      .then((m) => !off && setItems(m))
      .catch(() => !off && setItems([]));
    return () => {
      off = true;
    };
  }, []);

  // Author-picked products keep their chosen order; empty = all products.
  const byId = new Map(items.map((i) => [i.id, i]));
  const selected = config.itemIds.length
    ? config.itemIds.map((id) => byId.get(id)).filter((i): i is MenuItem => Boolean(i))
    : items;
  const shown = selected.slice(0, config.limit);

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
