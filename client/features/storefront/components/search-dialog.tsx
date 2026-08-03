"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/features/storefront/components/product-card";
import { useCart } from "@/hooks/use-cart";
import { useLocationStore } from "@/hooks/use-location-store";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { MenuItem } from "@/lib/types";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Full-menu search popup — self-contained (loads the menu + adds to cart). */
export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MenuItem[]>([]);

  const branchId = useLocationStore((s) => s.branchId);
  const fulfillment = useLocationStore((s) => s.fulfillment);
  const addItem = useCart((s) => s.addItem);
  const setCartBranch = useCart((s) => s.setBranch);
  const setFulfillmentType = useCart((s) => s.setFulfillmentType);

  // Load the menu (and reset the query) each time the popup opens.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    let off = false;
    api.getMenuItems().then((list) => {
      if (!off) setItems(list);
    });
    return () => {
      off = true;
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [];
    return items
      .filter((i) => `${i.name} ${i.description} ${i.tags.join(" ")}`.toLowerCase().includes(q))
      .slice(0, 24);
  }, [items, q]);

  const handleAdd = (item: MenuItem) => {
    if (branchId) setCartBranch(branchId);
    if (fulfillment !== "reserve") setFulfillmentType(fulfillment);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogTitle className="sr-only">Search the menu</DialogTitle>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
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
                <ProductCard key={item.id} item={item} onAdd={handleAdd} />
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
