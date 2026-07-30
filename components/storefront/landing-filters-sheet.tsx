"use client";

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PRICE_TIERS } from "@/components/storefront/filters-sheet";
import type { MenuTag } from "@/lib/types";
import { cn } from "@/lib/utils";

export type LandingSort = "relevance" | "rating" | "price-asc" | "price-desc";

export const LANDING_SORTS: { value: LandingSort; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "rating", label: "Top rated" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export const LANDING_DIET: { tag: MenuTag; label: string }[] = [
  { tag: "popular", label: "Popular" },
  { tag: "vegetarian", label: "Vegetarian" },
  { tag: "spicy", label: "Spicy" },
];

/** Count of non-default filter groups (for the trigger badge). */
export function landingFilterCount(sort: LandingSort, tags: MenuTag[], priceTiers: number[]) {
  return (sort !== "relevance" ? 1 : 0) + tags.length + priceTiers.length;
}

interface LandingFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sort: LandingSort;
  onSortChange: (sort: LandingSort) => void;
  tags: MenuTag[];
  onToggleTag: (tag: MenuTag) => void;
  priceTiers: number[];
  onTogglePrice: (i: number) => void;
  onClear: () => void;
}

export function LandingFiltersSheet({
  open,
  onOpenChange,
  sort,
  onSortChange,
  tags,
  onToggleTag,
  priceTiers,
  onTogglePrice,
  onClear,
}: LandingFiltersSheetProps) {
  const count = landingFilterCount(sort, tags, priceTiers);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>Sort &amp; filter</SheetTitle>
          {count > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="mr-8 text-sm font-medium text-brand hover:underline"
            >
              Clear all
            </button>
          )}
        </SheetHeader>

        <div className="space-y-6 px-6 pb-4">
          {/* Sort */}
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Sort by
            </h3>
            <div className="space-y-1">
              {LANDING_SORTS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSortChange(opt.value)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-secondary"
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border-2",
                      sort === opt.value ? "border-brand" : "border-border",
                    )}
                  >
                    {sort === opt.value && <span className="size-2.5 rounded-full bg-brand" />}
                  </span>
                  <span className="text-sm text-ink">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dietary */}
          <div>
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Dietary
            </h3>
            <div className="flex flex-wrap gap-2">
              {LANDING_DIET.map(({ tag, label }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    tags.includes(tag)
                      ? "border-brand bg-brand-tint text-brand-deep"
                      : "border-border bg-surface text-muted-foreground hover:border-brand/40",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Price
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {PRICE_TIERS.map((tier, i) => (
                <button
                  key={tier.label}
                  type="button"
                  onClick={() => onTogglePrice(i)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-xl border py-3 transition-colors",
                    priceTiers.includes(i)
                      ? "border-brand bg-brand-tint text-brand-deep"
                      : "border-border bg-surface text-muted-foreground hover:border-brand/40",
                  )}
                >
                  <span className="text-base font-semibold">{tier.label}</span>
                  <span className="text-[11px]">{tier.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-full bg-brand px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-brand-hover"
          >
            Show results
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
