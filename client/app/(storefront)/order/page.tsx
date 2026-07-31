"use client";

import { useMemo, useState, useEffect } from "react";
import { Search, SlidersHorizontal, UtensilsCrossed, X } from "lucide-react";
import {
  FiltersSheet,
  PRICE_TIERS,
  DEFAULT_FILTERS,
  activeFilterCount,
  type Filters,
} from "@/features/storefront/components/filters-sheet";
import { ProductCard } from "@/features/storefront/components/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { useTenant } from "@/hooks/use-tenant";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Apply the active filters (and search query) to the menu items. */
function applyFilters(items: MenuItem[], f: Filters, query: string): MenuItem[] {
  const q = query.trim().toLowerCase();
  const list = items.filter((item) => {
    if (f.categories.length && !f.categories.includes(item.categoryId)) return false;
    if (f.diet.length && !f.diet.every((t) => item.tags.includes(t))) return false;
    if (
      f.priceTiers.length &&
      !f.priceTiers.some((i) => item.price >= PRICE_TIERS[i].min && item.price < PRICE_TIERS[i].max)
    )
      return false;
    if (q && !`${item.name} ${item.description} ${item.tags.join(" ")}`.toLowerCase().includes(q))
      return false;
    // Note: "offers"/"vouchers" and the delivery/distance sorts are branch-level
    // and have no per-item data yet, so they don't affect the product list.
    return true;
  });

  if (f.sort === "rating") {
    return [...list].sort(
      (a, b) => Number(b.tags.includes("popular")) - Number(a.tags.includes("popular")),
    );
  }
  return list;
}

export default function OrderPage() {
  const tenant = useTenant();
  const addItem = useCart((s) => s.addItem);
  const setBranch = useCart((s) => s.setBranch);
  const cartBranchId = useCart((s) => s.branchId);

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [firstBranchId, setFirstBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cats, menu, branches] = await Promise.all([
          api.getCategories(),
          api.getMenuItems(),
          api.getBranches(),
        ]);
        if (!cancelled) {
          setCategories([...cats].sort((a, b) => a.sortOrder - b.sortOrder));
          setItems(menu);
          setFirstBranchId(branches[0]?.id ?? null);
        }
      } catch {
        if (!cancelled) setError("Could not load the menu. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(
    () => applyFilters(items, filters, query),
    [items, filters, query],
  );

  const toggleCategory = (id: string) =>
    setFilters((f) => ({
      ...f,
      categories: f.categories.includes(id)
        ? f.categories.filter((c) => c !== id)
        : [...f.categories, id],
    }));

  const filterCount = activeFilterCount(filters);
  const hasAnything = Boolean(query) || filterCount > 0;
  const clearAll = () => {
    setQuery("");
    setFilters(DEFAULT_FILTERS);
  };

  const handleAdd = (item: MenuItem) => {
    if (!cartBranchId && firstBranchId) setBranch(firstBranchId);
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

  return (
    <div>
      {/* Compact hero */}
      <section className="border-b border-border bg-gradient-to-br from-brand-tint via-surface to-accent-tint">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-4xl">
            {tenant.name} menu
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Browse the menu, filter, and add your favorites.
          </p>
        </div>
      </section>

      {/* Sticky toolbar: search + filters + category chips */}
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

          <div className="mt-3 flex items-center gap-2">
            {/* Filters button */}
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                filterCount > 0
                  ? "border-brand bg-brand-tint text-brand-deep"
                  : "border-border bg-surface text-ink hover:border-brand/40",
              )}
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {filterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-primary-foreground">
                  {filterCount}
                </span>
              )}
            </button>

            {/* Category quick chips (multi-select) */}
            <div className="-mr-4 flex gap-2 overflow-x-auto pr-4 [scrollbar-width:none] sm:mr-0 sm:pr-0 [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, categories: [] }))}
                aria-pressed={filters.categories.length === 0}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  filters.categories.length === 0
                    ? "border-brand bg-brand text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground hover:border-brand/40 hover:text-ink",
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  aria-pressed={filters.categories.includes(cat.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    filters.categories.includes(cat.id)
                      ? "border-brand bg-brand text-primary-foreground"
                      : "border-border bg-surface text-muted-foreground hover:border-brand/40 hover:text-ink",
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        {!loading && !error && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {visible.length} {visible.length === 1 ? "item" : "items"}
            </p>
            {hasAnything && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
              >
                <X className="size-3.5" />
                Clear all
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
        )}

        {error && (
          <EmptyState
            icon={UtensilsCrossed}
            title="Something went wrong"
            description={error}
            action={
              <button
                type="button"
                className="text-sm font-medium text-brand hover:underline"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            }
          />
        )}

        {!loading && !error && items.length > 0 && visible.length === 0 && (
          <EmptyState
            icon={Search}
            title="No dishes found"
            description="Try a different search or clear your filters."
            action={
              <button
                type="button"
                className="text-sm font-medium text-brand hover:underline"
                onClick={clearAll}
              >
                Clear filters
              </button>
            }
          />
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {visible.map((item) => (
              <ProductCard key={item.id} item={item} onAdd={handleAdd} />
            ))}
          </div>
        )}
      </div>

      <FiltersSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        categories={categories}
        value={filters}
        onApply={setFilters}
        getCount={(f) => applyFilters(items, f, query).length}
      />
    </div>
  );
}
