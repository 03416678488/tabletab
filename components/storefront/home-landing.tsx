"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpDown,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  RotateCcw,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { ReservationBookingFlow } from "@/components/reserve/reservation-booking-flow";
import { FeaturedCarousel } from "@/components/storefront/featured-carousel";
import { PRICE_TIERS } from "@/components/storefront/filters-sheet";
import {
  LANDING_DIET,
  LANDING_SORTS,
  landingFilterCount,
  type LandingSort,
} from "@/components/storefront/landing-filters-sheet";
import { OrderModePicker } from "@/components/storefront/order-mode-picker";
import { PromoDouble, PromoFull, PromoTriple } from "@/components/storefront/promo-banners";
import { ProductCard } from "@/components/storefront/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { useLocationStore } from "@/hooks/use-location-store";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { branchDistanceKm } from "@/lib/geo";
import type { BranchOnlineConfig } from "@/lib/mock/branch-online";
import type {
  Branch,
  BranchReservationSettings,
  MenuCategory,
  MenuItem,
  MenuTag,
} from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

/** The branch-selected landing: context bar, fulfillment tabs, and menu by category. */
export function HomeLanding({ onChangeBranch }: { onChangeBranch: () => void }) {
  const branchId = useLocationStore((s) => s.branchId);
  const fulfillment = useLocationStore((s) => s.fulfillment);
  const setFulfillment = useLocationStore((s) => s.setFulfillment);
  const coords = useLocationStore((s) => s.coords);

  const addItem = useCart((s) => s.addItem);
  const setCartBranch = useCart((s) => s.setBranch);
  const setFulfillmentType = useCart((s) => s.setFulfillmentType);
  const user = useCustomerSession((s) => s.user);

  const [branch, setBranch] = useState<Branch | null>(null);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [online, setOnline] = useState<BranchOnlineConfig | null>(null);
  const [reservationSettings, setReservationSettings] =
    useState<BranchReservationSettings | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [reorderItems, setReorderItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick-filters (light — the full panel lives on /order).
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<LandingSort>("relevance");
  const [quickTags, setQuickTags] = useState<MenuTag[]>([]);
  const [priceTiers, setPriceTiers] = useState<number[]>([]);
  const filtersActive = landingFilterCount(sort, quickTags, priceTiers) > 0;
  const anythingActive = filtersActive || query.trim().length > 0;

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [branches, cats, menu] = await Promise.all([
          api.getBranches(),
          api.getCategories(),
          api.getMenuItems(),
        ]);
        // A branch is only resolved once the user has picked/located one.
        const [cfg, resSettings] = branchId
          ? await Promise.all([
              api.getBranchOnlineConfig(branchId),
              api.getReservationSettings(branchId),
            ])
          : [null, null];
        if (cancelled) return;
        setAllBranches(branches);
        setBranch(branchId ? branches.find((b) => b.id === branchId) ?? null : null);
        setOnline(cfg);
        setReservationSettings(resSettings);
        setCategories([...cats].sort((a, b) => a.sortOrder - b.sortOrder));
        setItems(menu);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [branchId]);

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

  // Apply the search query, inline quick-filters (tags + price), and sort.
  const refine = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (list: MenuItem[]): MenuItem[] => {
      const out = list.filter(
        (i) =>
          quickTags.every((t) => i.tags.includes(t)) &&
          (priceTiers.length === 0 ||
            priceTiers.some(
              (ti) => i.price >= PRICE_TIERS[ti].min && i.price < PRICE_TIERS[ti].max,
            )) &&
          (!q || `${i.name} ${i.description} ${i.tags.join(" ")}`.toLowerCase().includes(q)),
      );
      if (sort === "rating") {
        return [...out].sort(
          (a, b) => Number(b.tags.includes("popular")) - Number(a.tags.includes("popular")),
        );
      }
      if (sort === "price-asc") return [...out].sort((a, b) => a.price - b.price);
      if (sort === "price-desc") return [...out].sort((a, b) => b.price - a.price);
      return out;
    };
  }, [quickTags, priceTiers, sort, query]);

  const popular = useMemo(
    () => refine(items.filter((i) => i.tags.includes("popular"))).slice(0, 8),
    [items, refine],
  );
  const itemsByCategory = useMemo(
    () =>
      categories.map((cat) => ({
        category: cat,
        items: refine(items.filter((i) => i.categoryId === cat.id)),
      })),
    [categories, items, refine],
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

  const toggleQuickTag = (tag: MenuTag) =>
    setQuickTags((tags) => (tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]));
  const togglePrice = (i: number) =>
    setPriceTiers((tiers) => (tiers.includes(i) ? tiers.filter((t) => t !== i) : [...tiers, i]));
  const clearFilters = () => {
    setSort("relevance");
    setQuickTags([]);
    setPriceTiers([]);
  };
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

  return (
    <div className="pb-8">
      {/* Tabs + location — sticky under the header while scrolling */}
      <div
        ref={stickyRef}
        className="sticky top-16 z-30 border-b border-border bg-subtle/95 backdrop-blur-md"
      >
        <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            {/* Fulfillment tabs */}
            <div className="order-2 md:order-1">
              <OrderModePicker value={fulfillment} onChange={setFulfillment} />
            </div>

          {/* Branch context */}
          <div className="order-1 flex items-center gap-2.5 rounded-full border border-border bg-surface px-3 py-1.5 shadow-[var(--shadow-card)] md:order-2 md:min-w-[19rem]">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
              <MapPin className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              {branchId ? (
                <>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {fulfillment === "delivery"
                      ? "Delivering from"
                      : fulfillment === "pickup"
                        ? "Pickup from"
                        : "Reserve at"}
                  </p>
                  {loading || !branch ? (
                    <Skeleton className="mt-1 h-4 w-40" />
                  ) : (
                    <p className="truncate text-sm font-semibold text-ink">
                      {branch.name}
                      {km != null && km < 50 && (
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          · {km < 10 ? km.toFixed(1) : Math.round(km)} km
                        </span>
                      )}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Your location
                  </p>
                  <p className="truncate text-sm font-semibold text-ink">Browsing all branches</p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={onChangeBranch}
              className="shrink-0 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand-tint"
            >
              {branchId ? "Change" : "Set location"}
            </button>
          </div>
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
      ) : (
        <>
      {/* Closed-branch notice */}
      {!loading && branch && !branch.isOpen && (
        <div className="mx-auto max-w-6xl px-4 pt-2 sm:px-6">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-accent-tint px-4 py-3 text-amber-800">
            <Clock className="mt-0.5 size-5 shrink-0" />
            <p className="flex-1 text-sm font-medium">
              {branch.name} is currently closed. You can browse the menu — ordering resumes when we
              reopen.
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

      {/* Search + mode-aware status / CTA */}
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes…"
            aria-label="Search menu"
            className="h-12 w-full rounded-full border border-border bg-surface pl-12 pr-10 text-base text-ink shadow-[var(--shadow-card)] outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-brand/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Inline sort & filters */}
        <div className="-mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {/* Sort */}
          <div className="relative shrink-0">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as LandingSort)}
              aria-label="Sort menu"
              className="h-9 cursor-pointer appearance-none rounded-full border border-border bg-surface pl-9 pr-8 text-sm font-medium text-ink outline-none transition-colors hover:border-brand/40 focus:ring-2 focus:ring-brand/40"
            >
              {LANDING_SORTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          <span className="h-6 w-px shrink-0 bg-border" aria-hidden />

          {/* Dietary chips */}
          {LANDING_DIET.map(({ tag, label }) => {
            const active = quickTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleQuickTag(tag)}
                aria-pressed={active}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1 rounded-full border px-3.5 text-sm font-medium transition-colors",
                  active
                    ? "border-brand bg-brand-tint text-brand-deep"
                    : "border-border bg-surface text-muted-foreground hover:border-brand/40 hover:text-ink",
                )}
              >
                {active && <Check className="size-3.5" />}
                {label}
              </button>
            );
          })}

          {/* Price chips */}
          {PRICE_TIERS.map((tier, i) => {
            const active = priceTiers.includes(i);
            return (
              <button
                key={tier.label}
                type="button"
                onClick={() => togglePrice(i)}
                aria-pressed={active}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-sm font-medium transition-colors",
                  active
                    ? "border-brand bg-brand-tint text-brand-deep"
                    : "border-border bg-surface text-muted-foreground hover:border-brand/40 hover:text-ink",
                )}
              >
                {tier.label}
              </button>
            );
          })}

          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-1 inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-sm font-medium text-brand hover:bg-brand-tint"
            >
              <X className="size-3.5" />
              Clear
            </button>
          )}
        </div>

        {!loading && branch && online && (
          <ModeBanner mode={fulfillment} branch={branch} online={online} />
        )}
      </div>

      {loading ? (
        <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
          <CarouselSkeleton />
          <CarouselSkeleton />
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

          {/* Promo row 1 */}
          <PromoTriple />

          {/* Order again — returning customers */}
          {!anythingActive && reorderItems.length > 0 && (
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
              <h2 className="mb-3 font-display text-lg font-bold text-ink">Popular right now</h2>
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

          {/* Promo row 2 */}
          {popular.length > 0 && <PromoDouble />}

          {/* Sticky category nav (scroll-spy) — sits below the sticky tabs bar */}
          {itemsByCategory.some(({ items: ci }) => ci.length > 0) && (
            <div
              className="sticky z-20 border-y border-border bg-surface/95 backdrop-blur-md"
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
                {/* Promo row 3 — before the Wood-Fired Pizza section */}
                {category.id === "cat-pizza" && <PromoFull />}
                <section
                  id={`cat-${category.id}`}
                  ref={(el) => {
                    sectionRefs.current[category.id] = el;
                  }}
                  className="mx-auto max-w-6xl px-4 py-4 sm:px-6"
                  style={{ scrollMarginTop: `calc(7rem + ${stickyHeight}px)` }}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="font-display text-lg font-bold text-ink">{category.name}</h2>
                    <Link
                      href="/order"
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

          {/* No items match the active search / quick-filters */}
          {anythingActive &&
            popular.length === 0 &&
            itemsByCategory.every(({ items: catItems }) => catItems.length === 0) && (
              <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6">
                <p className="font-display text-lg font-semibold text-ink">No dishes match</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {query ? `Nothing for “${query}”.` : "Try removing a filter to see more."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    clearFilters();
                  }}
                  className="mt-4 text-sm font-medium text-brand hover:underline"
                >
                  Clear {query ? "search" : "filters"}
                </button>
              </div>
            )}
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

function CarouselSkeleton() {
  return (
    <div>
      <Skeleton className="mb-3 h-6 w-40" />
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-40 shrink-0 space-y-2 sm:w-48">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
