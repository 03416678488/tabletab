"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, UtensilsCrossed } from "lucide-react";
import { ProductCard } from "@/features/storefront/components/product-card";
import { ProductHeroMedia } from "@/features/menu/components/product-hero-media";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { useCart } from "@/hooks/use-cart";
import { useLocationStore } from "@/hooks/use-location-store";
import { toast } from "@/hooks/use-toast";
import { useStorefrontProducts } from "@/features/storefront/hooks/use-storefront-products";
import { useStorefrontBranches } from "@/features/storefront/hooks/use-storefront-branches";
import { useStorefrontSync } from "@/features/storefront/hooks/use-storefront-sync";
import type { CartItemModifier, MenuItem, MenuTag } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const TAG_LABELS: Record<MenuTag, string> = {
  popular: "Popular",
  new: "New",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  "gluten-free": "Gluten-free",
  spicy: "Spicy",
  "chef-special": "Chef's special",
};

export default function ProductDetailsPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = use(params);
  const router = useRouter();

  const addItem = useCart((s) => s.addItem);
  const setCartBranch = useCart((s) => s.setBranch);
  const cartBranchId = useCart((s) => s.branchId);
  const locationBranchId = useLocationStore((s) => s.branchId);

  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState("");

  // Cached storefront data (React Query).
  const { products, isLoading: productsLoading } = useStorefrontProducts();
  const { branches, isLoading: branchesLoading } = useStorefrontBranches();
  useStorefrontSync();
  const loading = productsLoading || branchesLoading;

  const item = useMemo(() => products.find((p) => p.id === itemId) ?? null, [products, itemId]);
  const related = useMemo(
    () =>
      item
        ? products.filter((i) => i.categoryId === item.categoryId && i.id !== item.id).slice(0, 4)
        : [],
    [products, item],
  );
  const firstBranchId = branches[0]?.id ?? null;
  const notFound = !loading && !item;

  // Reset the customization form whenever the viewed item changes.
  useEffect(() => {
    setQuantity(1);
    setSelected({});
    setNotes("");
  }, [itemId]);

  const modifiers: CartItemModifier[] = useMemo(() => {
    if (!item) return [];
    const result: CartItemModifier[] = [];
    for (const group of item.modifiers) {
      for (const optId of selected[group.id] ?? []) {
        const opt = group.options.find((o) => o.id === optId);
        if (opt) {
          result.push({
            groupId: group.id,
            optionId: opt.id,
            label: opt.label,
            priceDelta: opt.priceDelta,
          });
        }
      }
    }
    return result;
  }, [item, selected]);

  const unitTotal = item ? item.price + modifiers.reduce((s, m) => s + m.priceDelta, 0) : 0;
  const missingRequired = useMemo(
    () =>
      item
        ? item.modifiers.filter((g) => g.required && !selected[g.id]?.length).map((g) => g.label)
        : [],
    [item, selected],
  );

  const toggleOption = (groupId: string, optionId: string, multiple: boolean) =>
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (multiple) {
        return {
          ...prev,
          [groupId]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      }
      return { ...prev, [groupId]: [optionId] };
    });

  const handleAdd = () => {
    if (!item || missingRequired.length > 0) return;
    if (!cartBranchId) {
      const seed = locationBranchId ?? firstBranchId;
      if (seed) setCartBranch(seed);
    }
    addItem({
      menuItemId: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      unitPrice: item.price,
      quantity,
      modifiers,
      notes: notes.trim() || undefined,
    });
    toast(`${quantity} × ${item.name} added to cart`, { tone: "success" });
    router.back();
  };

  const quickAdd = (m: MenuItem) => {
    if (!cartBranchId) {
      const seed = locationBranchId ?? firstBranchId;
      if (seed) setCartBranch(seed);
    }
    addItem({
      menuItemId: m.id,
      name: m.name,
      imageUrl: m.imageUrl,
      unitPrice: m.price,
      quantity: 1,
      modifiers: [],
    });
    toast(`${m.name} added to cart`, { tone: "success" });
  };

  if (loading) return <DetailsSkeleton />;

  if (notFound || !item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={UtensilsCrossed}
          title="Dish not found"
          description="This item may no longer be on the menu."
          action={
            <Button asChild variant="outline">
              <Link href="/order">Back to menu</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const quantityStepper = (
    <div className="flex items-center gap-1 rounded-full border border-border p-1">
      <button
        type="button"
        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
        disabled={quantity <= 1}
        aria-label="Decrease quantity"
        className="flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-secondary disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-[2ch] text-center font-semibold">{quantity}</span>
      <button
        type="button"
        onClick={() => setQuantity((q) => q + 1)}
        aria-label="Increase quantity"
        className="flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-secondary"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );

  const addButton = (
    <Button
      size="lg"
      className="flex-1"
      disabled={!item.isAvailable || missingRequired.length > 0}
      onClick={handleAdd}
    >
      {item.isAvailable ? `Add to cart · ${formatCurrency(unitTotal * quantity)}` : "Sold out"}
    </Button>
  );

  return (
    <div className="pb-36 lg:pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:pt-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-10">
          {/* Media — sticky on desktop */}
          <div className="lg:sticky lg:top-24">
            <ProductHeroMedia
              item={item}
              priority
              className="aspect-[4/3] rounded-2xl sm:aspect-[16/9] lg:aspect-square"
              sizes="(max-width: 1024px) 100vw, 512px"
            />
          </div>

          {/* Details */}
          <div className="mt-5 lg:mt-0">
            {item.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <StatusPill key={tag} tone="brand" dot={false}>
                    {TAG_LABELS[tag]}
                  </StatusPill>
                ))}
              </div>
            )}

            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl lg:text-4xl">
                {item.name}
              </h1>
              <span className="shrink-0 font-display text-xl font-bold text-ink lg:text-2xl">
                {formatCurrency(item.price)}
              </span>
            </div>
            <p className="mt-2 leading-relaxed text-muted-foreground">{item.description}</p>

            {!item.isAvailable && (
              <p className="mt-4 rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-muted-foreground">
                This dish is currently sold out.
              </p>
            )}

            {/* Modifiers */}
            {item.modifiers.length > 0 && (
              <div className="mt-6 space-y-6">
                {item.modifiers.map((group) => (
                  <div key={group.id}>
                    <div className="flex items-center justify-between">
                      <p className="font-display font-semibold text-ink">{group.label}</p>
                      <span className="text-xs font-medium text-muted-foreground">
                        {group.required
                          ? "Required"
                          : group.multiple
                            ? "Optional · multiple"
                            : "Optional"}
                      </span>
                    </div>
                    <div className="mt-2.5 space-y-2">
                      {group.options.map((opt) => {
                        const checked = (selected[group.id] ?? []).includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => toggleOption(group.id, opt.id, group.multiple)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                              checked ? "border-brand bg-brand-tint" : "border-border hover:bg-secondary",
                            )}
                          >
                            <span className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "flex size-5 items-center justify-center border-2 transition-colors",
                                  group.multiple ? "rounded-md" : "rounded-full",
                                  checked
                                    ? "border-brand bg-brand text-primary-foreground"
                                    : "border-border",
                                )}
                              >
                                {checked && <span className="size-2 rounded-full bg-current" />}
                              </span>
                              {opt.label}
                            </span>
                            <span className="text-muted-foreground">
                              {opt.priceDelta > 0 ? `+${formatCurrency(opt.priceDelta)}` : "Included"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Special instructions */}
            <div className="mt-6">
              <label htmlFor="notes" className="font-display font-semibold text-ink">
                Special instructions
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Allergies, preferences…"
                rows={2}
                className="mt-2 w-full rounded-xl border border-input bg-surface px-3.5 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand/40"
              />
            </div>

            {/* Inline add-to-cart — desktop only */}
            <div className="mt-8 hidden items-center gap-3 border-t border-border pt-6 lg:flex">
              {quantityStepper}
              {addButton}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-3 font-display text-lg font-bold text-ink sm:text-xl">
              You might also like
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {related.map((m) => (
                <ProductCard key={m.id} item={m} onAdd={quickAdd} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky add-to-cart bar — mobile only (desktop uses the inline one) */}
      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-surface/95 backdrop-blur-md md:bottom-0 md:pb-safe lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          {quantityStepper}
          {addButton}
        </div>
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:pt-8">
      <Skeleton className="mb-4 h-8 w-20 rounded-full" />
      <div className="lg:grid lg:grid-cols-2 lg:gap-10">
        <Skeleton className="aspect-[4/3] w-full rounded-2xl sm:aspect-[16/9] lg:aspect-square" />
        <div className="mt-5 lg:mt-0">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <Skeleton className="mt-6 h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
