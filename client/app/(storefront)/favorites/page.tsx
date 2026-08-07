"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { AuthGuard } from "@/features/storefront/components/auth-guard";
import { ProductCard } from "@/features/storefront/components/product-card";
import { useFavoritesStore } from "@/features/storefront/hooks/use-favorites";
import { useStorefrontProducts } from "@/features/storefront/hooks/use-storefront-products";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerSession } from "@/hooks/use-customer-session";

function FavoritesContent() {
  const user = useCustomerSession((s) => s.user);
  // Reactive list of this customer's saved item ids (save order, oldest→newest).
  const favoriteIds = useFavoritesStore((s) => (user ? s.byCustomer[user.id] ?? [] : []));
  const { products, isLoading } = useStorefrontProducts();

  if (!user) return null;

  // Resolve ids → live products (dropping any that are gone/unavailable), then
  // show most-recently-saved first.
  const favoriteSet = new Set(favoriteIds);
  const ordered = products
    .filter((p) => favoriteSet.has(p.id))
    .sort((a, b) => favoriteIds.indexOf(b.id) - favoriteIds.indexOf(a.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-tint text-brand">
          <Heart className="size-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">My favorites</h1>
          <p className="text-muted-foreground">
            {isLoading
              ? "Loading your saved items…"
              : `${ordered.length} saved item${ordered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Tap the heart on any dish to save it here for quick re-ordering."
          action={
            <Button asChild>
              <Link href="/">Browse the menu</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ordered.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <AuthGuard>
      <FavoritesContent />
    </AuthGuard>
  );
}
