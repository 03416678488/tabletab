"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useCart, lineItemTotal } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";

interface CartSummaryProps {
  deliveryFee?: number;
  showCheckout?: boolean;
  compact?: boolean;
}

export function CartSummary({ deliveryFee = 0, showCheckout = true, compact }: CartSummaryProps) {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const tax = useCart((s) => s.tax());
  const total = useCart((s) => s.totalWithFees(deliveryFee));
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description="Add items from the menu to get started."
        action={
          showCheckout ? (
            <Button asChild variant="outline">
              <Link href="/order">Browse branches</Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <ul className={compact ? "space-y-3" : "space-y-4"}>
        {items.map((item) => (
          <li key={item.id} className="flex gap-3">
            {!compact && (
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-subtle">
                <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="56px" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{item.name}</p>
                  {item.modifiers.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {item.modifiers.map((m) => m.label).join(", ")}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm font-medium">
                  {formatCurrency(lineItemTotal(item))}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  aria-label="Decrease"
                >
                  <Minus className="size-3" />
                </Button>
                <span className="w-6 text-center text-sm">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  aria-label="Increase"
                >
                  <Plus className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-8 text-muted-foreground"
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery fee</span>
            <span>{formatCurrency(deliveryFee)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between font-semibold text-ink">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {showCheckout && (
        <Button asChild className="w-full" size="lg">
          <Link href="/checkout">Go to checkout</Link>
        </Button>
      )}
    </div>
  );
}
