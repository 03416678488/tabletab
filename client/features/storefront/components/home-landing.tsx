"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  RotateCcw,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { ReservationBookingFlow } from "@/features/reserve/components/reservation-booking-flow";
import { BlockList } from "@/features/website-builder/render/block-renderer";
import { useSiteHeaderConfig } from "@/features/website-builder/render/site-chrome";
import type { Block } from "@/features/website-builder/schemas/blocks";
import { FeaturedCarousel } from "@/features/storefront/components/featured-carousel";
import { LandingSkeleton } from "@/features/storefront/components/landing-skeleton";
import { OrderModePicker } from "@/features/storefront/components/order-mode-picker";
import { ProductCard } from "@/features/storefront/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { useLocationStore } from "@/hooks/use-location-store";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { branchDistanceKm, nearestBranch } from "@/lib/geo";
import { useStorefrontBranches } from "@/features/storefront/hooks/use-storefront-branches";
import { useStorefrontCategories } from "@/features/storefront/hooks/use-storefront-categories";
import { useStorefrontProducts } from "@/features/storefront/hooks/use-storefront-products";
import { useStorefrontSync } from "@/features/storefront/hooks/use-storefront-sync";
import { fetchReservationSettings } from "@/features/reserve/services/reservation-settings.service";
import type { BranchOnlineConfig } from "@/lib/mock/branch-online";
import type { Branch, BranchReservationSettings, MenuItem } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

/** Delivery/pickup availability derived from the branch's own settings. */
function branchOnlineConfig(branch: Branch): BranchOnlineConfig {
  const online = branch.onlineOrderingEnabled !== false;
  return {
    // The master "online ordering" toggle gates the per-channel toggles.
    deliveryAvailable: online && branch.deliveryEnabled !== false,
    pickupAvailable: online && branch.pickupEnabled !== false,
    deliveryFee: branch.deliveryFee ?? 0,
    deliveryEtaMinutes: branch.deliveryEtaMinutes ?? 30,
    pickupSlots: [],
  };
}

/** The branch-selected landing: context bar, fulfillment tabs, and menu by category. */
export function HomeLanding({
  onChangeBranch,
  publishedBlocks,
}: {
  onChangeBranch: () => void;
  /** When set (and no search/filter is active), custom builder blocks replace
      the default carousels/menu sections — the top chrome is untouched. */
  publishedBlocks?: Block[] | null;
}) {
  const branchId = useLocationStore((s) => s.branchId);
  const fulfillment = useLocationStore((s) => s.fulfillment);
  const setFulfillment = useLocationStore((s) => s.setFulfillment);
  const coords = useLocationStore((s) => s.coords);

  const addItem = useCart((s) => s.addItem);
  const setCartBranch = useCart((s) => s.setBranch);
  const setFulfillmentType = useCart((s) => s.setFulfillmentType);
  const user = useCustomerSession((s) => s.user);

  // Cached live branches (React Query); branch + online config derived reactively.
  const { branches: allBranches, isLoading: branchesLoading } = useStorefrontBranches();
  const branch = useMemo(
    () =>
      branchId
        ? (allBranches.find((b) => b.id === branchId) ?? null)
        : nearestBranch(allBranches, coords),
    [allBranches, branchId, coords],
  );
  const online = useMemo(() => (branch ? branchOnlineConfig(branch) : null), [branch]);
  // Per-mode availability from the branch's live settings (drives the tab picker).
  const availability = useMemo(
    () => ({
      delivery: online?.deliveryAvailable ?? true,
      pickup: online?.pickupAvailable ?? true,
      reserve: branch ? branch.reservationsEnabled !== false : true,
    }),
    [online, branch],
  );
  // If the selected mode becomes unavailable (staff toggled it off), move to the
  // first available one so the customer never sits on a dead tab.
  useEffect(() => {
    if (!branch) return;
    if (availability[fulfillment] === false) {
      const next = (["delivery", "pickup", "reserve"] as const).find((m) => availability[m]);
      if (next) setFulfillment(next);
    }
  }, [availability, fulfillment, branch, setFulfillment]);

  const [reservationSettings, setReservationSettings] = useState<BranchReservationSettings | null>(
    null,
  );
  const [reorderItems, setReorderItems] = useState<MenuItem[]>([]);

  // Menu content (categories + items) — real catalog, cached (React Query).
  const { categories: rawCategories, isLoading: catsLoading } = useStorefrontCategories();
  const { products: items, isLoading: itemsLoading } = useStorefrontProducts();
  const categories = useMemo(
    () => [...rawCategories].sort((a, b) => a.sortOrder - b.sortOrder),
    [rawCategories],
  );
  const loading = branchesLoading || catsLoading || itemsLoading;

  // Scroll-spy state for the sticky category nav.
  const [activeCategory, setActiveCategory] = useState<string>("");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Measure the sticky tabs/location bar so the category nav can stack below it.
  const stickyRef = useRef<HTMLDivElement>(null);
  const [stickyHeight, setStickyHeight] = useState(0);
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStickyHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reservation settings follow the resolved branch.
  useEffect(() => {
    if (!branch) {
      setReservationSettings(null);
      return;
    }
    let cancelled = false;
    fetchReservationSettings(branch.id)
      .catch(() => null)
      .then((s) => {
        if (!cancelled) setReservationSettings(s);
      });
    return () => {
      cancelled = true;
    };
  }, [branch]);

  // Live branch + menu — staff toggles (open/closed, delivery/pickup, reservation)
  // and menu edits (price, sold-out, add/remove) reconcile the storefront in real
  // time by invalidating the cached branch/menu queries.
  useStorefrontSync();

  // "Order again" — resolve the signed-in customer's past order items to menu items.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const userId = user?.id;
      if (!userId || items.length === 0) {
        setReorderItems([]);
        return;
      }
      const orders = await api.getCustomerOrders(userId);
      if (cancelled) return;
      const seen = new Set<string>();
      const resolved: MenuItem[] = [];
      for (const order of orders) {
        for (const line of order.items) {
          if (seen.has(line.menuItemId)) continue;
          seen.add(line.menuItemId);
          const found = items.find((i) => i.id === line.menuItemId);
          if (found) resolved.push(found);
        }
      }
      setReorderItems(resolved.slice(0, 8));
    })();
    return () => {
      cancelled = true;
    };
  }, [user, items]);

  const popular = useMemo(
    () => items.filter((i) => i.tags.includes("popular")).slice(0, 8),
    [items],
  );
  const itemsByCategory = useMemo(
    () =>
      categories.map((cat) => ({
        category: cat,
        items: items.filter((i) => i.categoryId === cat.id),
      })),
    [categories, items],
  );

  // Scroll-spy: highlight the category currently in view in the sticky nav.
  useEffect(() => {
    const sections = categories
      .map((c) => sectionRefs.current[c.id])
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveCategory(visible[0].target.id.replace("cat-", ""));
      },
      { rootMargin: `-${112 + stickyHeight}px 0px -55% 0px`, threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categories, itemsByCategory, stickyHeight]);

  // Represent each category with its first dish photo (picsum fallback).
  const categoryThumb = useMemo(() => {
    const map: Record<string, string> = {};
    for (const cat of categories) {
      map[cat.id] =
        items.find((i) => i.categoryId === cat.id)?.imageUrl ??
        `https://picsum.photos/seed/${cat.id}/200/200`;
    }
    return map;
  }, [categories, items]);

  const handleAdd = (item: MenuItem) => {
    // Browse-all mode: fall back to the first branch so checkout still works.
    const seed = branchId ?? allBranches[0]?.id;
    if (seed) setCartBranch(seed);
    if (fulfillment !== "reserve") setFulfillmentType(fulfillment);
    addItem({
      menuItemId: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      unitPrice: item.price,
      quantity: 1,
      modifiers: [],
    });
    toast(`${item.name} added to cart`, { tone: "success" });
  };

  const scrollToCategory = (id: string) => {
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const catScrollRef = useRef<HTMLDivElement>(null);
  const scrollCats = (dir: -1 | 1) =>
    catScrollRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });

  const km = branch ? branchDistanceKm(branch, coords) : null;

  // Website-builder "Show location" toggle — hides the branch/location display
  // (the fulfillment tabs stay, since they drive ordering, not location).
  const showLocation = useSiteHeaderConfig()?.showLocation ?? true;

  return (
    <div className="pb-8">
      {/* Tabs + location — sticky under the header while scrolling */}
      <div
        ref={stickyRef}
        className="sticky top-16 z-30 border-b border-border bg-subtle md:bg-subtle/95 md:backdrop-blur-md"
      >
        <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            {/* Fulfillment tabs */}
            <div className="order-2 md:order-1">
              <OrderModePicker
                value={fulfillment}
                onChange={setFulfillment}
                availability={availability}
              />
            </div>

            {/* Branch context */}
            {showLocation && (
              <div className="order-1 flex items-center gap-2.5 rounded-full border border-border bg-surface px-3 py-1.5 shadow-[var(--shadow-card)] md:order-2 md:min-w-[19rem]">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
                  <MapPin className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {branch
                      ? fulfillment === "delivery"
                        ? "Delivering from"
                        : fulfillment === "pickup"
                          ? "Pickup from"
                          : "Reserve at"
                      : "Your location"}
                  </p>
                  {loading ? (
                    <Skeleton className="mt-1 h-4 w-40" />
                  ) : branch ? (
                    <p className="truncate text-sm font-semibold text-ink">
                      {branch.name}
                      {km != null && km < 50 && (
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          · {km < 10 ? km.toFixed(1) : Math.round(km)} km
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="truncate text-sm font-semibold text-ink">Set your location</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onChangeBranch}
                  className="shrink-0 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand-tint"
                >
                  {branch ? "Change" : "Set location"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {fulfillment === "reserve" ? (
        <ReservationPane
          branchId={branchId}
          branch={branch}
          settings={reservationSettings}
          loading={loading}
          onChangeBranch={onChangeBranch}
        />
      ) : loading ? (
        <LandingSkeleton />
      ) : (
        <>
          {/* Closed-branch notice */}
          {branch && !branch.isOpen && (
            <div className="mx-auto max-w-6xl px-4 pt-2 sm:px-6">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-accent-tint px-4 py-3 text-amber-800">
                <Clock className="mt-0.5 size-5 shrink-0" />
                <p className="flex-1 text-sm font-medium">
                  {branch.name} is currently closed. You can browse the menu — ordering resumes when
                  we reopen.
                </p>
                <button
                  type="button"
                  onClick={onChangeBranch}
                  className="shrink-0 text-sm font-semibold underline"
                >
                  Switch branch
                </button>
              </div>
            </div>
          )}

          {/* Mode-aware status */}
          {!loading && branch && online && (
            <div className="mx-auto max-w-6xl px-4 pt-2 sm:px-6">
              <ModeBanner mode={fulfillment} branch={branch} online={online} />
            </div>
          )}

          {publishedBlocks && publishedBlocks.length > 0 ? (
            // A published custom landing takes over the body.
            <div className="pt-2">
              <BlockList blocks={publishedBlocks} />
            </div>
          ) : (
            <>
              {/* Category carousel — "Cuisines for you" style */}
              {categories.length > 0 && (
                <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
                  <h2 className="mb-4 font-display text-xl font-bold text-ink sm:text-2xl">
                    Cuisines for you
                  </h2>
                  <div className="relative">
                    {/* Prev / next arrows (desktop) */}
                    <button
                      type="button"
                      onClick={() => scrollCats(-1)}
                      aria-label="Scroll categories left"
                      className="absolute -left-3 top-14 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-[var(--shadow-elevated)] transition-colors hover:bg-secondary sm:flex"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCats(1)}
                      aria-label="Scroll categories right"
                      className="absolute -right-3 top-14 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-[var(--shadow-elevated)] transition-colors hover:bg-secondary sm:flex"
                    >
                      <ChevronRight className="size-5" />
                    </button>

                    <div
                      ref={catScrollRef}
                      className="-mx-4 flex gap-4 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
                    >
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => scrollToCategory(cat.id)}
                          className="group flex w-24 shrink-0 flex-col items-center gap-2 sm:w-28"
                        >
                          <span className="relative aspect-square w-full overflow-hidden rounded-2xl bg-subtle shadow-[var(--shadow-card)] transition-transform group-hover:-translate-y-1 group-active:scale-95">
                            <Image
                              src={categoryThumb[cat.id]}
                              alt={cat.name}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                              sizes="112px"
                            />
                          </span>
                          <span className="line-clamp-2 text-center text-sm font-semibold leading-tight text-brand">
                            {cat.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Order again — returning customers */}
              {reorderItems.length > 0 && (
                <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
                  <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-ink">
                    <RotateCcw className="size-5 text-brand" />
                    Order again
                  </h2>
                  <div className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {reorderItems.map((item) => (
                      <div key={item.id} className="w-40 shrink-0 snap-start sm:w-48">
                        <ProductCard item={item} onAdd={handleAdd} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Popular carousel */}
              {popular.length > 0 && (
                <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
                  <h2 className="mb-3 font-display text-lg font-bold text-ink">
                    Popular right now
                  </h2>
                  <div className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {popular.map((item) => (
                      <div key={item.id} className="w-40 shrink-0 snap-start sm:w-48">
                        <ProductCard item={item} onAdd={handleAdd} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Featured highlights carousel */}
              <FeaturedCarousel />

              {/* Sticky category nav (scroll-spy) — sits below the sticky tabs bar */}
              {itemsByCategory.some(({ items: ci }) => ci.length > 0) && (
                <div
                  className="sticky z-20 border-y border-border bg-surface md:bg-surface/95 md:backdrop-blur-md"
                  style={{ top: `calc(4rem + ${stickyHeight}px)` }}
                >
                  <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                      {itemsByCategory.map(
                        ({ category, items: ci }) =>
                          ci.length > 0 && (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => scrollToCategory(category.id)}
                              className={cn(
                                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                                activeCategory === category.id
                                  ? "border-brand bg-brand text-primary-foreground"
                                  : "border-border bg-surface text-muted-foreground hover:border-brand/40 hover:text-ink",
                              )}
                            >
                              {category.name}
                            </button>
                          ),
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Category sections */}
              {itemsByCategory.map(({ category, items: catItems }) => {
                if (catItems.length === 0) return null;
                return (
                  <Fragment key={category.id}>
                    <section
                      id={`cat-${category.id}`}
                      ref={(el) => {
                        sectionRefs.current[category.id] = el;
                      }}
                      // content-visibility skips rendering off-screen category
                      // sections while scrolling a long menu; contain-intrinsic-size
                      // reserves their space (auto = remember real height after first
                      // paint) so the scrollbar and category jumps stay accurate.
                      className="mx-auto max-w-6xl px-4 py-4 sm:px-6 [content-visibility:auto] [contain-intrinsic-size:auto_500px]"
                      style={{ scrollMarginTop: `calc(7rem + ${stickyHeight}px)` }}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 className="font-display text-lg font-bold text-ink">{category.name}</h2>
                        <Link
                          href="/"
                          className="inline-flex items-center gap-0.5 text-sm font-medium text-brand hover:underline"
                        >
                          See all <ChevronRight className="size-4" />
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                        {catItems.slice(0, 4).map((item) => (
                          <ProductCard key={item.id} item={item} onAdd={handleAdd} />
                        ))}
                      </div>
                    </section>
                  </Fragment>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}

function ReservationPane({
  branchId,
  branch,
  settings,
  loading,
  onChangeBranch,
}: {
  branchId: string | null;
  branch: Branch | null;
  settings: BranchReservationSettings | null;
  loading: boolean;
  onChangeBranch: () => void;
}) {
  if (!branchId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-tint text-brand">
          <CalendarDays className="size-7" />
        </span>
        <h2 className="mt-4 font-display text-2xl font-bold text-ink">Reserve a table</h2>
        <p className="mx-auto mt-1 max-w-sm text-muted-foreground">
          Choose a branch to see available dates, times, and tables.
        </p>
        <button
          type="button"
          onClick={onChangeBranch}
          className="mt-5 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover"
        >
          Set location
        </button>
      </div>
    );
  }

  if (loading || !branch || !settings) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!settings.enabled) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <CalendarDays className="size-7" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold text-ink">
          Reservations aren&apos;t available
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-muted-foreground">
          {branch.name} doesn&apos;t take table bookings right now.
        </p>
        <button
          type="button"
          onClick={onChangeBranch}
          className="mt-5 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-tint"
        >
          Try another branch
        </button>
      </div>
    );
  }

  return <ReservationBookingFlow branch={branch} settings={settings} />;
}

function ModeBanner({
  mode,
  branch,
  online,
}: {
  mode: "delivery" | "pickup" | "reserve";
  branch: Branch;
  online: BranchOnlineConfig;
}) {
  if (mode === "reserve") {
    return (
      <Link
        href={`/reserve/${branch.id}`}
        className="mt-4 flex items-center gap-3 rounded-2xl bg-brand px-4 py-3.5 text-primary-foreground shadow-[var(--shadow-card)]"
      >
        <CalendarDays className="size-5 shrink-0" />
        <span className="flex-1 text-sm font-semibold">Reserve a table at {branch.name}</span>
        <ChevronRight className="size-5 shrink-0" />
      </Link>
    );
  }

  if (mode === "pickup") {
    return (
      <p className="mt-4 flex items-center gap-2 rounded-2xl bg-accent-tint px-4 py-3 text-sm font-medium text-amber-700">
        <ShoppingBag className="size-4 shrink-0" />
        {online.pickupAvailable
          ? `Pickup from ${branch.name} · ready in ~15 min`
          : "Pickup isn't available at this branch right now."}
      </p>
    );
  }

  return (
    <p className="mt-4 flex items-center gap-2 rounded-2xl bg-brand-tint px-4 py-3 text-sm font-medium text-brand-deep">
      {online.deliveryAvailable ? (
        <>
          <Truck className="size-4 shrink-0" />
          Delivery · ~{online.deliveryEtaMinutes} min ·{" "}
          {online.deliveryFee === 0 ? "Free" : formatCurrency(online.deliveryFee)}
        </>
      ) : (
        <>
          <Clock className="size-4 shrink-0" />
          Delivery isn&apos;t available here — try pickup instead.
        </>
      )}
    </p>
  );
}
