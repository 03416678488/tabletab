"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import { CartSummary } from "@/components/order/cart-summary";
import { MenuItemCard } from "@/components/order/menu-item-card";
import { ModifierSheet } from "@/components/order/modifier-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { useCart } from "@/hooks/use-cart";
import { api } from "@/lib/api";
import type { Branch, MenuCategory, MenuItem } from "@/lib/types";
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

  const [branch, setBranchState] = useState<Branch | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modifierItem, setModifierItem] = useState<MenuItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [b, cats, menu] = await Promise.all([
          api.getBranch(branchId),
          api.getCategories(),
          api.getMenuItems(),
        ]);
        if (!b) {
          if (!cancelled) setError("Branch not found");
          return;
        }
        if (!cancelled) {
          setBranchState(b);
          setBranch(branchId);
          const sorted = [...cats].sort((a, c) => a.sortOrder - c.sortOrder);
          setCategories(sorted);
          setItems(menu);
          setActiveCategory(sorted[0]?.id ?? null);
        }
      } catch {
        if (!cancelled) setError("Could not load menu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [branchId, setBranch]);

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
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="hidden h-64 lg:block" />
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <EmptyState
          icon={UtensilsCrossed}
          title={error ?? "Branch not found"}
          action={
            <Button asChild>
              <Link href="/order">Back to branches</Link>
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
              <Link href="/order">Choose another branch</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/order">
            <ArrowLeft className="size-4" />
            All branches
          </Link>
        </Button>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{branch.name}</h1>
            <p className="text-sm text-muted-foreground">
              {branch.address}, {branch.city}
            </p>
          </div>
          <StatusPill tone="green">Open now</StatusPill>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            {/* Category nav */}
            <div className="sticky top-16 z-30 -mx-4 mb-6 overflow-x-auto border-b border-border bg-subtle/95 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:top-16">
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      activeCategory === cat.id
                        ? "bg-brand text-primary-foreground"
                        : "bg-surface text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
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

      {/* Mobile sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface p-4 pb-safe shadow-[var(--shadow-elevated)] lg:hidden">
        <Button className="w-full" size="lg" onClick={() => router.push("/checkout")}>
          View cart &amp; checkout
        </Button>
      </div>
      <div className="h-20 lg:hidden" aria-hidden />

      <ModifierSheet item={modifierItem} open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
