"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { CartSummary } from "@/features/order/components/cart-summary";
import { MenuBodySkeleton } from "@/features/order/components/menu-skeleton";
import { MenuHighlights } from "@/features/order/components/menu-highlights";
import { MenuItemCard } from "@/features/order/components/menu-item-card";
import { ModifierSheet } from "@/features/order/components/modifier-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useCart } from "@/hooks/use-cart";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatCurrency } from "@/lib/utils";
import { useStorefrontBranches } from "@/features/storefront/hooks/use-storefront-branches";
import { useStorefrontCategories } from "@/features/storefront/hooks/use-storefront-categories";
import { useStorefrontProducts } from "@/features/storefront/hooks/use-storefront-products";
import { useStorefrontSync } from "@/features/storefront/hooks/use-storefront-sync";
import type { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function BranchMenuPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = use(params);
  const router = useRouter();
  const setBranch = useCart((s) => s.setBranch);
  const addItem = useCart((s) => s.addItem);
  const itemCount = useCart((s) => s.itemCount());
  const cartTotal = useCart((s) => s.totalWithFees(0));
  const hydrated = useHydrated();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [modifierItem, setModifierItem] = useState<MenuItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Cached storefront data (React Query) — branch/category/menu.
  const { branches, isLoading: branchesLoading, isError: branchesError } = useStorefrontBranches();
  const { categories: rawCategories, isLoading: catsLoading, isError: catsError } =
    useStorefrontCategories();
  const { products: items, isLoading: itemsLoading, isError: itemsError } = useStorefrontProducts();
  useStorefrontSync();

  const loading = branchesLoading || catsLoading || itemsLoading;
  const branch = useMemo(
    () => branches.find((b) => b.id === branchId) ?? null,
    [branches, branchId],
  );
  const categories = useMemo(
    () => [...rawCategories].sort((a, c) => a.sortOrder - c.sortOrder),
    [rawCategories],
  );
  const error =
    branchesError || catsError || itemsError
      ? "Could not load menu."
      : !loading && !branch
        ? "Branch not found"
        : null;

  // Anchor the cart to this branch, and default to the first category.
  useEffect(() => {
    if (branch) setBranch(branchId);
  }, [branch, branchId, setBranch]);
  useEffect(() => {
    if (!activeCategory && categories[0]) setActiveCategory(categories[0].id);
  }, [categories, activeCategory]);

  const filteredItems = useMemo(() => {
    if (!activeCategory) return items;
    return items.filter((i) => i.categoryId === activeCategory);
  }, [items, activeCategory]);

  const handleAdd = (item: MenuItem) => {
    if (item.modifiers.length > 0) {
      setModifierItem(item);
      setSheetOpen(true);
    } else {
      addItem({
        menuItemId: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        unitPrice: item.price,
        quantity: 1,
        modifiers: [],
      });
    }
  };

  if (loading) {
    return <MenuBodySkeleton />;
  }

  if (error || !branch) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <EmptyState
          icon={UtensilsCrossed}
          title={error ?? "Branch not found"}
          action={
            <Button asChild>
              <Link href="/">Back to branches</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (!branch.isOpen) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <EmptyState
          icon={UtensilsCrossed}
          title="This location is closed"
          description="Please choose another branch or check back during service hours."
          action={
            <Button asChild>
              <Link href="/">Choose another branch</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const showBar = hydrated && itemCount > 0;

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
        <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
          <Link href="/">
            <ArrowLeft className="size-4" />
            All branches
          </Link>
        </Button>

        <div className="mb-4 min-w-0 sm:mb-6">
          <h1 className="truncate font-display text-xl font-bold text-ink sm:text-3xl">
            {branch.name}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {branch.address}, {branch.city}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            {/* Highlighted dishes — swipeable image slider */}
            <MenuHighlights items={items} onAdd={handleAdd} />

            {/* Category nav — horizontally scrollable pill bar */}
            <div className="sticky top-16 z-30 -mx-4 mb-4 border-b border-border bg-subtle/95 backdrop-blur-sm sm:-mx-6 sm:mb-6">
              <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      activeCategory === cat.id
                        ? "bg-brand text-primary-foreground shadow-sm"
                        : "bg-surface text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {filteredItems.length === 0 ? (
                <EmptyState
                  title="No items in this category"
                  description="Try another category from the menu above."
                />
              ) : (
                filteredItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} onAdd={handleAdd} />
                ))
              )}
            </div>
          </div>

          {/* Desktop cart */}
          <div className="hidden lg:block">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Your order</CardTitle>
              </CardHeader>
              <CardContent>
                <CartSummary showCheckout />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile floating cart bar — sits above the tab bar once the cart has items */}
      <div
        className={cn(
          "fixed inset-x-0 z-40 px-4 transition-all duration-300 lg:hidden",
          "bottom-[calc(0.75rem+env(safe-area-inset-bottom))]",
          showBar
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <button
          type="button"
          onClick={() => router.push("/checkout")}
          className="flex w-full items-center gap-3 rounded-2xl bg-brand px-4 py-3 text-left text-primary-foreground shadow-[var(--shadow-elevated)] active:scale-[0.99]"
        >
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15">
            <ShoppingBag className="size-5" />
            <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-brand">
              {itemCount}
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] leading-tight opacity-90">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="block text-base font-semibold leading-tight">View cart</span>
          </span>
          <span className="shrink-0 text-base font-bold">{formatCurrency(cartTotal)}</span>
        </button>
      </div>
      {/* Clearance so the floating bar never covers the last menu item */}
      <div className={cn("lg:hidden", showBar ? "h-24" : "h-4")} aria-hidden />

      <ModifierSheet item={modifierItem} open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
