"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/features/storefront/components/product-card";
import { useStorefrontProducts } from "@/features/storefront/hooks/use-storefront-products";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Full-menu search popup — searches the live catalog; cards open the details
 *  dialog to customise & add (same as the menu pages). */
export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  // Real, cached storefront catalog (same source as the menu pages) — the mock
  // `api.getMenuItems()` used before didn't match the live menu.
  const { products: items } = useStorefrontProducts();

  // Reset the query each time the popup opens.
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [];
    return items
      .filter((i) => `${i.name} ${i.description} ${i.tags.join(" ")}`.toLowerCase().includes(q))
      .slice(0, 24);
  }, [items, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Anchored near the top (translate-y-0 overrides the base vertical
          centering) so the search bar sits up top, like a command palette. */}
      {/* No corner ✕ — the input's clear-✕ handles text; "Cancel" closes the
          popup (a second bare ✕ next to the clear-✕ was confusing). */}
      <DialogContent className="top-[8vh] max-w-3xl translate-y-0" showCloseButton={false}>
        <DialogTitle className="sr-only">Search the menu</DialogTitle>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              // Not type="search": that renders a *native* ✕ clear button that
              // duplicated our custom one. type="text" leaves only ours.
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes…"
              aria-label="Search the menu"
              className="h-12 w-full rounded-full border border-border bg-surface pl-12 pr-10 text-base text-ink outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-brand/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-ink"
          >
            Cancel
          </button>
        </div>

        {!q ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Start typing to search the menu.
          </p>
        ) : results.length === 0 ? (
          <EmptyState
            className="py-10"
            icon={Search}
            title="No dishes found"
            description={`Nothing matches “${query}”.`}
          />
        ) : (
          <div className="max-h-[60vh] overflow-y-auto p-1">
            <p className="mb-3 text-xs text-muted-foreground">
              {results.length} result{results.length === 1 ? "" : "s"}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {results.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
