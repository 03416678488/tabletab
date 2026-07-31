"use client";

import { ShoppingBag } from "lucide-react";
import { TenantLogo } from "@/components/brand/tenant-logo";
import { Button } from "@/components/ui/button";
import { useVenueStore } from "@/hooks/use-venue-store";

export function VenueHeader() {
  const tableLabel = useVenueStore((s) => s.tableLabel);
  const itemCount = useVenueStore((s) => s.itemCount());
  const setCartOpen = useVenueStore((s) => s.setCartOpen);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4">
        <div className="min-w-0 flex-1">
          <TenantLogo variant="compact" />
          {tableLabel && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">Table {tableLabel}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="relative shrink-0 gap-1.5 rounded-full px-3"
          onClick={() => setCartOpen(true)}
        >
          <ShoppingBag className="size-4" />
          <span className="hidden xs:inline">Cart</span>
          {itemCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-primary-foreground">
              {itemCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}
