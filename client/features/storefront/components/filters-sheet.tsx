"use client";

import { useState } from "react";
import { Check, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { MenuCategory, MenuTag } from "@/lib/types";
import { cn } from "@/lib/utils";

export type SortKey = "relevance" | "fastest" | "distance" | "rating";

export interface Filters {
  /** Selected category ids (empty = all). Surfaced as "Cuisines". */
  categories: string[];
  sort: SortKey;
  offers: boolean;
  vouchers: boolean;
  /** Indices into PRICE_TIERS (empty = any price). */
  priceTiers: number[];
  diet: MenuTag[];
}

export const DEFAULT_FILTERS: Filters = {
  categories: [],
  sort: "relevance",
  offers: false,
  vouchers: false,
  priceTiers: [],
  diet: [],
};

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "fastest", label: "Fastest delivery" },
  { value: "distance", label: "Distance" },
  { value: "rating", label: "Top rated" },
];

export const PRICE_TIERS: { label: string; hint: string; min: number; max: number }[] = [
  { label: "$", hint: "Under 10", min: 0, max: 10 },
  { label: "$$", hint: "10–20", min: 10, max: 20 },
  { label: "$$$", hint: "20+", min: 20, max: Infinity },
];

const DIET_OPTIONS: { tag: MenuTag; label: string }[] = [
  { tag: "vegetarian", label: "Vegetarian" },
  { tag: "vegan", label: "Vegan" },
  { tag: "gluten-free", label: "Gluten-free" },
  { tag: "spicy", label: "Spicy" },
  { tag: "popular", label: "Popular" },
];

/** Count of active, non-default filter groups (for a badge). */
export function activeFilterCount(f: Filters): number {
  return (
    (f.sort !== "relevance" ? 1 : 0) +
    (f.offers ? 1 : 0) +
    (f.vouchers ? 1 : 0) +
    f.priceTiers.length +
    f.diet.length +
    f.categories.length
  );
}

interface FiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: MenuCategory[];
  value: Filters;
  onApply: (filters: Filters) => void;
  /** Preview count for the "Show results" button. */
  getCount: (filters: Filters) => number;
}

export function FiltersSheet(props: FiltersSheetProps) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col p-0">
        {/* Panel is remounted on each open, so its draft state resets from `value`. */}
        {props.open && <FiltersPanel {...props} />}
      </SheetContent>
    </Sheet>
  );
}

function FiltersPanel({ categories, value, onApply, onOpenChange, getCount }: FiltersSheetProps) {
  const [draft, setDraft] = useState<Filters>(value);
  const [cuisineQuery, setCuisineQuery] = useState("");

  const toggle = <T,>(list: T[], item: T): T[] =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(cuisineQuery.trim().toLowerCase()),
  );

  const apply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  return (
    <>
      <SheetHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
        <SheetTitle className="font-display text-lg">Filters</SheetTitle>
        <button
          type="button"
          onClick={() => setDraft(DEFAULT_FILTERS)}
          className="mr-8 text-sm font-medium text-brand hover:underline"
        >
          Clear all
        </button>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* Sort */}
        <Section title="Sort by">
          <div className="space-y-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, sort: opt.value }))}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-secondary"
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border-2",
                    draft.sort === opt.value ? "border-brand" : "border-border",
                  )}
                >
                  {draft.sort === opt.value && <span className="size-2.5 rounded-full bg-brand" />}
                </span>
                <span className="text-sm text-ink">{opt.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Quick toggles */}
        <Section title="Quick filters">
          <ToggleRow
            label="Offers"
            checked={draft.offers}
            onChange={() => setDraft((d) => ({ ...d, offers: !d.offers }))}
          />
          <ToggleRow
            label="Accepts vouchers"
            checked={draft.vouchers}
            onChange={() => setDraft((d) => ({ ...d, vouchers: !d.vouchers }))}
          />
        </Section>

        {/* Cuisines (categories) */}
        <Section title="Cuisines">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={cuisineQuery}
              onChange={(e) => setCuisineQuery(e.target.value)}
              placeholder="Search for cuisines"
              className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm text-ink outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-brand/40"
            />
          </div>
          <div className="space-y-1">
            {filteredCategories.map((cat) => {
              const checked = draft.categories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, categories: toggle(d.categories, cat.id) }))
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-secondary"
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-md border-2 transition-colors",
                      checked ? "border-brand bg-brand text-primary-foreground" : "border-border",
                    )}
                  >
                    {checked && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className="text-sm text-ink">{cat.name}</span>
                </button>
              );
            })}
            {filteredCategories.length === 0 && (
              <p className="px-2 py-2 text-sm text-muted-foreground">No cuisines found.</p>
            )}
          </div>
        </Section>

        {/* Dietary */}
        <Section title="Dietary">
          <div className="flex flex-wrap gap-2">
            {DIET_OPTIONS.map(({ tag, label }) => {
              const checked = draft.diet.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, diet: toggle(d.diet, tag) }))}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    checked
                      ? "border-brand bg-brand-tint text-brand-deep"
                      : "border-border bg-surface text-muted-foreground hover:border-brand/40",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Price */}
        <Section title="Price" last>
          <div className="grid grid-cols-3 gap-2">
            {PRICE_TIERS.map((tier, i) => {
              const checked = draft.priceTiers.includes(i);
              return (
                <button
                  key={tier.label}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, priceTiers: toggle(d.priceTiers, i) }))}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-xl border py-3 transition-colors",
                    checked
                      ? "border-brand bg-brand-tint text-brand-deep"
                      : "border-border bg-surface text-muted-foreground hover:border-brand/40",
                  )}
                >
                  <span className="text-base font-semibold">{tier.label}</span>
                  <span className="text-[11px]">{tier.hint}</span>
                </button>
              );
            })}
          </div>
        </Section>
      </div>

      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={apply}
          className="w-full rounded-full bg-brand px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-brand-hover"
        >
          Show {getCount(draft)} results
        </button>
      </div>
    </>
  );
}

function Section({
  title,
  last,
  children,
}: {
  title: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(!last && "mb-6 border-b border-border pb-6")}>
      <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-left hover:bg-secondary"
      aria-pressed={checked}
    >
      <span className="text-sm text-ink">{label}</span>
      <span
        className={cn(
          "relative h-6 w-10 rounded-full transition-colors",
          checked ? "bg-brand" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
            checked ? "left-[1.125rem]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
