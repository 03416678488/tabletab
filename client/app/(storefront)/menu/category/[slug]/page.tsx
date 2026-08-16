"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { slugify } from "@/lib/utils";
import { ProductCard } from "@/features/storefront/components/product-card";
import { useStorefrontCategories } from "@/features/storefront/hooks/use-storefront-categories";
import { useStorefrontProducts } from "@/features/storefront/hooks/use-storefront-products";
import { useStorefrontSync } from "@/features/storefront/hooks/use-storefront-sync";

/**
 * A single category's dishes. Linked from builder blocks (`/menu/category/{slug}`)
 * so a category link works on any storefront page — including a published custom
 * home that doesn't render the default menu sections. Categories are per-branch
 * (many "Starters"), so we match by name-slug against the selected branch.
 */
export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const { categories, isLoading: catsLoading } = useStorefrontCategories();
  const { products, isLoading: productsLoading } = useStorefrontProducts();
  useStorefrontSync();

  const name = useMemo(
    () => categories.find((c) => slugify(c.name) === slug)?.name ?? null,
    [categories, slug],
  );
  const items = useMemo(() => {
    const idToSlug = new Map(categories.map((c) => [c.id, slugify(c.name)]));
    return products.filter((p) => idToSlug.get(p.categoryId) === slug);
  }, [categories, products, slug]);

  const loading = catsLoading || productsLoading;
  const title = name ?? slug.replace(/-/g, " ");

  return (
    <div>
      <section className="border-b border-border bg-gradient-to-br from-brand-tint via-surface to-accent-tint">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <Link
            href="/"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" /> Full menu
          </Link>
          <h1 className="font-display text-2xl font-bold capitalize tracking-tight text-ink sm:text-4xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {items.length} {items.length === 1 ? "dish" : "dishes"}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {loading && items.length === 0 ? (
          <GridSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="No dishes here"
            description="This category has no available dishes at your branch right now."
            action={
              <Button asChild variant="outline">
                <Link href="/">Browse the full menu</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {items.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
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
  );
}
