"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { MenuCategory, MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmblaSlider } from "@/features/website-builder/render/embla-slider";
import { ProductCard } from "@/features/storefront/components/product-card";
import { useStorefrontMenus } from "@/features/storefront/hooks/use-storefront-menus";
import { useStorefrontCategories } from "@/features/storefront/hooks/use-storefront-categories";
import { useStorefrontProducts } from "@/features/storefront/hooks/use-storefront-products";
import type { StorefrontMenu } from "@/features/website-builder/services/storefront-menus";
import type {
  FeaturedCategoriesConfig,
  MenuGridConfig,
  ProductCarouselConfig,
} from "@/features/website-builder/schemas/blocks";

const shell = "mx-auto max-w-6xl px-4 sm:px-6";

export function MenuGridRender({ config }: { config: MenuGridConfig }) {
  // Cached + live via SSE (see useStorefrontSync): sold-out dishes drop out and
  // menu edits reconcile without a reload.
  const { menus, isSuccess: loaded } = useStorefrontMenus();

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
  // Real catalog, cached + live via SSE (see useStorefrontSync).
  const { categories: cats } = useStorefrontCategories();
  const { products: items } = useStorefrontProducts();

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
  // Real catalog, cached + live via SSE (see useStorefrontSync).
  const { products: items } = useStorefrontProducts();

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
