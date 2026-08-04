"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Search, UtensilsCrossed, X } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/hooks/use-tenant";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useStorefrontCategories } from "@/features/storefront/hooks/use-storefront-categories";
import { useStorefrontSync } from "@/features/storefront/hooks/use-storefront-sync";
import { useCatalogInfinite } from "@/features/storefront/hooks/use-catalog-infinite";
import { VirtualProductGrid } from "@/features/storefront/components/virtual-product-grid";
import type { MenuCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Price ranges → server min/max. Index 0 is "any" (no price filter). */
const PRICE_TIERS: { label: string; min?: number; max?: number }[] = [
  { label: "Any price" },
  { label: "Under $10", max: 10 },
  { label: "$10 – $20", min: 10, max: 20 },
  { label: "$20 – $30", min: 20, max: 30 },
  { label: "$30+", min: 30 },
];

export default function OrderPage() {
  // useSearchParams needs a Suspense boundary above it in the App Router.
  return (
    <Suspense>
      <OrderPageInner />
    </Suspense>
  );
}

function OrderPageInner() {
  const tenant = useTenant();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(qParam);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [priceTier, setPriceTier] = useState(0);
  const { categories } = useStorefrontCategories();
  useStorefrontSync();

  // The header search submits to /order?q=… — keep in sync with the URL.
  useEffect(() => setQuery(qParam), [qParam]);

  const tier = PRICE_TIERS[priceTier];
  const { items, total, loading, error, hasMore, loadMore, reload } = useCatalogInfinite({
    search: debouncedQuery,
    categoryIds,
    minPrice: tier.min,
    maxPrice: tier.max,
  });

  const toggleCategory = (id: string) =>
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const hasQuery = Boolean(debouncedQuery) || categoryIds.length > 0 || priceTier > 0;
  const clearAll = () => {
    setQuery("");
    setCategoryIds([]);
    setPriceTier(0);
  };
  const initialLoading = loading && items.length === 0;

  // Infinite scroll: load the next page as the sentinel (below the grid) nears view.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "600px" }, // prefetch before it's actually on screen
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore, items.length]);

  return (
    <div>
      {/* Compact hero */}
      <section className="border-b border-border bg-gradient-to-br from-brand-tint via-surface to-accent-tint">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-4xl">
            {tenant.name} menu
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Search the full menu and add your favorites.
          </p>
        </div>
      </section>

      {/* Sticky toolbar: search + category chips */}
      <div className="z-30 border-b border-border bg-surface/95 backdrop-blur-md md:sticky md:top-16">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes…"
              aria-label="Search menu"
              className="h-12 w-full rounded-full border border-border bg-surface pl-12 pr-4 text-base text-ink outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-brand/40"
            />
          </div>

          {/* Price selector + multi-select category chips (all server-side) */}
          <div className="mt-3 flex items-center gap-2">
            <select
              value={priceTier}
              onChange={(e) => setPriceTier(Number(e.target.value))}
              aria-label="Filter by price"
              className={cn(
                "h-9 shrink-0 rounded-full border bg-surface px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand/40",
                priceTier > 0
                  ? "border-brand text-brand-deep"
                  : "border-border text-muted-foreground",
              )}
            >
              {PRICE_TIERS.map((t, i) => (
                <option key={i} value={i}>
                  {t.label}
                </option>
              ))}
            </select>

            <div className="-mr-4 flex gap-2 overflow-x-auto pr-4 [scrollbar-width:none] sm:mr-0 sm:pr-0 [&::-webkit-scrollbar]:hidden">
              <Chip active={categoryIds.length === 0} onClick={() => setCategoryIds([])}>
                All
              </Chip>
              {categories.map((cat) => (
                <Chip
                  key={cat.id}
                  active={categoryIds.includes(cat.id)}
                  onClick={() => toggleCategory(cat.id)}
                >
                  {cat.name}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        {!initialLoading && !error && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "item" : "items"}
            </p>
            {hasQuery && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
              >
                <X className="size-3.5" />
                Clear
              </button>
            )}
          </div>
        )}

        {initialLoading && <GridSkeleton />}

        {error && items.length === 0 && (
          <EmptyState
            icon={UtensilsCrossed}
            title="Something went wrong"
            description={error}
            action={
              <button
                type="button"
                className="text-sm font-medium text-brand hover:underline"
                onClick={reload}
              >
                Retry
              </button>
            }
          />
        )}

        {!initialLoading && !error && total === 0 && (
          <EmptyState
            icon={Search}
            title="No dishes found"
            description="Try a different search or category."
            action={
              hasQuery ? (
                <button
                  type="button"
                  className="text-sm font-medium text-brand hover:underline"
                  onClick={clearAll}
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        )}

        {items.length > 0 && (
          <>
            <VirtualProductGrid items={items} />
            <div ref={sentinelRef} className="py-6 text-center text-sm text-muted-foreground">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Loading more…
                </span>
              ) : hasMore ? (
                <button
                  type="button"
                  onClick={loadMore}
                  className="font-medium text-brand hover:underline"
                >
                  Load more
                </button>
              ) : (
                <span>You’ve reached the end · {total} items</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-brand bg-brand text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:border-brand/40 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border bg-surface">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
