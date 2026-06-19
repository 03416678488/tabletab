"use client";

import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useVenueStore } from "@/hooks/use-venue-store";
import { formatBuffetSummary } from "@/lib/buffet-utils";
import { lineItemUnitPrice } from "@/lib/cart-utils";
import { formatCurrency } from "@/lib/utils";

interface VenueCartDrawerProps {
  onCheckout: () => void;
}

export function VenueCartDrawer({ onCheckout }: VenueCartDrawerProps) {
  const cartOpen = useVenueStore((s) => s.cartOpen);
  const setCartOpen = useVenueStore((s) => s.setCartOpen);
  const items = useVenueStore((s) => s.items);
  const buffet = useVenueStore((s) => s.buffet);
  const setBuffet = useVenueStore((s) => s.setBuffet);
  const updateQuantity = useVenueStore((s) => s.updateQuantity);
  const removeItem = useVenueStore((s) => s.removeItem);
  const subtotal = useVenueStore((s) => s.subtotal());
  const tax = useVenueStore((s) => s.tax());
  const total = useVenueStore((s) => s.total());

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Your order</SheetTitle>
        </SheetHeader>

        {items.length === 0 && !buffet ? (
          <div className="px-6 py-8">
            <EmptyState
              icon={ShoppingBag}
              title="Cart is empty"
              description="Add a buffet package or browse the menu."
            />
          </div>
        ) : (
          <>
            {buffet && (
              <div className="mx-6 mb-4 rounded-xl border border-amber-200 bg-accent-tint/40 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                      Buffet
                    </p>
                    <p className="text-sm font-medium text-ink">{formatBuffetSummary(buffet)}</p>
                    <p className="text-sm text-muted-foreground">
                      {buffet.totalCovers} covers · {formatCurrency(buffet.subtotal)}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setBuffet(null)}>
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {items.length > 0 && (
            <ul className="max-h-[45vh] space-y-4 overflow-y-auto px-6">
              {items.map((item) => {
                const unit = lineItemUnitPrice(item);
                return (
                  <li key={item.id} className="flex gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-subtle">
                      <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <p className="font-medium text-ink">{item.name}</p>
                        <span className="shrink-0 text-sm font-semibold">
                          {formatCurrency(unit * item.quantity)}
                        </span>
                      </div>
                      {item.modifiers.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {item.modifiers.map((m) => m.label).join(", ")}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs italic text-muted-foreground">&ldquo;{item.notes}&rdquo;</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto size-8 text-muted-foreground"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            )}

            <div className="space-y-1 border-t border-border px-6 pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between font-display text-base font-bold text-ink">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <SheetFooter className="px-6">
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  setCartOpen(false);
                  onCheckout();
                }}
              >
                Place order · {formatCurrency(total)}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
