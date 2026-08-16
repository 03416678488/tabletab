"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgePercent, CalendarCheck, ChevronRight, UtensilsCrossed } from "lucide-react";

import { AppImage } from "@/components/ui/app-image";
import type { MenuItem } from "@/lib/types";
import { cn, formatCurrency, isLocalUpload, slugify } from "@/lib/utils";
import { EmblaSlider } from "@/features/website-builder/render/embla-slider";
import { ProductCard } from "@/features/storefront/components/product-card";
import { useStorefrontMenus } from "@/features/storefront/hooks/use-storefront-menus";
import { useStorefrontCategories } from "@/features/storefront/hooks/use-storefront-categories";
import { useStorefrontProducts } from "@/features/storefront/hooks/use-storefront-products";
import { useStorefrontBranches } from "@/features/storefront/hooks/use-storefront-branches";
import { useLocationStore } from "@/hooks/use-location-store";
import { useActivePromotions } from "@/features/promotion/hooks/use-active-promotions";
import type { Promotion } from "@/features/promotion/types/promotion.types";
import type {
  FeaturedCategoriesConfig,
  MenuGridConfig,
  MenuSliderConfig,
  ProductCarouselConfig,
  PromotionsConfig,
  ReservationConfig,
} from "@/features/website-builder/schemas/blocks";

const shell = "mx-auto max-w-6xl px-4 sm:px-6";

export function MenuGridRender({ config }: { config: MenuGridConfig }) {
  // Cached + live via SSE (see useStorefrontSync): sold-out dishes drop out and
  // menu edits reconcile without a reload.
  const { menus, isSuccess: loaded } = useStorefrontMenus();

  // Every active menu for the selected branch (only those with dishes).
  const withItems = menus.filter((m) => m.items.length > 0);
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
                  href={`/menu/${menu.id}`}
                  className="inline-flex items-center gap-0.5 text-sm font-medium text-brand hover:underline"
                >
                  View all <ChevronRight className="size-4" />
                </Link>
              )}
            </div>
            {config.layout === "slider" ? (
              <EmblaSlider slideClassName="basis-1/2 sm:basis-1/4" showArrows={config.showArrows}>
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

  // Every category for the selected branch (each rendered as its own section).
  const selected = cats;

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
                  href={`/menu/category/${slugify(cat.name)}`}
                  className="inline-flex items-center gap-0.5 text-sm font-medium text-brand hover:underline"
                >
                  View all <ChevronRight className="size-4" />
                </Link>
              )}
            </div>
            {config.layout === "slider" ? (
              <EmblaSlider slideClassName="basis-1/2 sm:basis-1/4" showArrows={config.showArrows}>
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

export function MenuSliderRender({ config }: { config: MenuSliderConfig }) {
  // Cached + live via SSE (see useStorefrontSync).
  const { menus, isSuccess: loaded } = useStorefrontMenus();

  // Every active menu for the selected branch.
  const selected = menus;

  if (loaded && selected.length === 0) return null;

  return (
    <section className={cn(shell, "py-4")}>
      {config.title && (
        <h2 className="mb-4 font-display text-xl font-bold text-ink sm:text-2xl">{config.title}</h2>
      )}
      <EmblaSlider
        slideClassName="basis-[31%] sm:basis-[21%] lg:basis-[13%]"
        showArrows={config.showArrows}
      >
        {selected.map((menu) => (
          <Link
            key={menu.id}
            href={`/menu/${menu.id}`}
            className="group flex flex-col items-center gap-2"
          >
            <span className="relative aspect-square w-full overflow-hidden rounded-2xl bg-subtle shadow-[var(--shadow-card)] transition-transform group-hover:-translate-y-1 group-active:scale-95">
              {menu.imageUrl ? (
                <Image
                  src={menu.imageUrl}
                  alt={menu.name}
                  fill
                  unoptimized={isLocalUpload(menu.imageUrl)}
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 31vw, (max-width: 1024px) 21vw, 13vw"
                />
              ) : (
                <span className="flex h-full items-center justify-center bg-brand-tint text-brand-deep">
                  <UtensilsCrossed className="size-8" />
                </span>
              )}
            </span>
            <span className="line-clamp-2 text-center text-sm font-semibold leading-tight text-brand">
              {menu.name}
            </span>
          </Link>
        ))}
      </EmblaSlider>
    </section>
  );
}

export function ReservationRender({ config }: { config: ReservationConfig }) {
  // Book at the branch the customer is currently ordering from.
  const { branches } = useStorefrontBranches();
  const selectedBranchId = useLocationStore((s) => s.branchId);
  const branch = branches.find((b) => b.id === selectedBranchId);

  // Reservations off (or flag unknown) at this branch → hide the widget.
  if (!branch || !branch.reservationsEnabled) return null;

  const onLight = config.tone === "light";
  const tone =
    config.tone === "dark"
      ? "bg-ink text-white"
      : config.tone === "brand"
        ? "bg-brand text-primary-foreground"
        : "bg-subtle text-ink";
  const button = onLight
    ? "bg-brand text-primary-foreground hover:bg-brand-hover"
    : "bg-white text-ink hover:-translate-y-0.5";

  return (
    <section className={cn(shell, "py-4")}>
      <div className={cn("overflow-hidden rounded-3xl px-6 py-10 sm:px-10", tone)}>
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">{config.title}</h2>
          {config.subtitle && (
            <p
              className={cn(
                "mt-2 text-sm sm:text-base",
                onLight ? "text-muted-foreground" : "opacity-90",
              )}
            >
              {config.subtitle}
            </p>
          )}
          <div className="mt-6 flex justify-center">
            <Link
              href={`/reserve/${branch.id}`}
              className={cn(
                "inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold shadow-sm transition-transform",
                button,
              )}
            >
              <CalendarCheck className="size-4" /> {config.buttonLabel}
            </Link>
          </div>
        </div>
      </div>
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
        <EmblaSlider slideClassName="basis-1/2 sm:basis-1/4" showArrows={config.showArrows}>
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

/** Discount seal, e.g. "30% OFF" or "$5 OFF". */
function promoBadge(p: Promotion): string {
  if (!p.discountValue) return "OFFER";
  return p.discountType === "percentage"
    ? `${p.discountValue}% OFF`
    : `${formatCurrency(p.discountValue)} OFF`;
}

function PromoCard({ promo }: { promo: Promotion }) {
  const badge = promoBadge(promo);
  return (
    <Link
      href={`/promotion/${promo.slug}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-2xl shadow-[var(--shadow-card)]"
    >
      <AppImage
        src={promo.imageUrl ?? ""}
        alt={promo.title}
        fill
        fallbackIcon={BadgePercent}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, 25vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
      <span className="absolute right-3 top-3 flex size-14 flex-col items-center justify-center rounded-full bg-accent text-center font-bold uppercase leading-none text-white shadow-md">
        <span className="text-sm">{badge.split(" ")[0]}</span>
        {badge.split(" ")[1] && <span className="text-[9px]">{badge.split(" ")[1]}</span>}
      </span>
      <h3 className="absolute inset-x-0 bottom-0 p-4 font-display text-lg font-bold leading-tight text-white drop-shadow">
        {promo.title}
      </h3>
    </Link>
  );
}

/** Live promotions as cards — grid or slider. Renders nothing when none are active. */
export function PromotionsRender({ config }: { config: PromotionsConfig }) {
  const { promotions } = useActivePromotions();
  const shown = promotions.slice(0, config.limit);
  if (shown.length === 0) return null;

  return (
    <section className={cn(shell, "py-4")}>
      {config.title && (
        <h2 className="mb-4 font-display text-lg font-bold text-ink sm:text-xl">{config.title}</h2>
      )}
      {config.layout === "slider" ? (
        <EmblaSlider slideClassName="basis-1/2 sm:basis-1/4" showArrows={config.showArrows}>
          {shown.map((p) => (
            <div key={p.id}>
              <PromoCard promo={p} />
            </div>
          ))}
        </EmblaSlider>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => (
            <PromoCard key={p.id} promo={p} />
          ))}
        </div>
      )}
    </section>
  );
}
