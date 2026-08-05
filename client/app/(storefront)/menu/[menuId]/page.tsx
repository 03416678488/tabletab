"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";

import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/features/storefront/components/product-card";
import { useStorefrontMenus } from "@/features/storefront/hooks/use-storefront-menus";
import { useStorefrontProducts } from "@/features/storefront/hooks/use-storefront-products";
import { useStorefrontSync } from "@/features/storefront/hooks/use-storefront-sync";

export default function MenuPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = use(params);

  // Membership + name come from the menus feed; full item data (with sizes /
  // variants / add-ons for the customise dialog) comes from the products feed.
  const { menus, isLoading: menusLoading } = useStorefrontMenus();
  const { products, isLoading: productsLoading } = useStorefrontProducts();
  useStorefrontSync();

  const menu = useMemo(() => menus.find((m) => m.id === menuId) ?? null, [menus, menuId]);
  const items = useMemo(() => {
    if (!menu) return [];
    const ids = new Set(menu.items.map((i) => i.id));
    return products.filter((p) => ids.has(p.id));
  }, [menu, products]);

  const loading = menusLoading || productsLoading;

  if (loading && !menu) return <MenuSkeleton />;

  if (!menu) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={UtensilsCrossed}
          title="Menu not found"
          description="This menu may no longer be available."
          action={
            <Button asChild variant="outline">
              <Link href="/">Browse the full menu</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      {/* Hero — the menu's photo (if any) behind its name. */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-brand-tint via-surface to-accent-tint">
        {menu.imageUrl && (
          <AppImage
            src={menu.imageUrl}
            alt=""
            fill
            className="object-cover opacity-25"
            sizes="100vw"
          />
        )}
        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <Link
            href="/"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" /> Full menu
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-4xl">
            {menu.name}
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
            title="No dishes yet"
            description="This menu doesn't have any available dishes right now."
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

function MenuSkeleton() {
  return (
    <div>
      <section className="border-b border-border bg-gradient-to-br from-brand-tint via-surface to-accent-tint">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-9 w-64" />
          <Skeleton className="mt-2 h-4 w-24" />
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <GridSkeleton />
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
