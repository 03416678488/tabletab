"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useHydrated } from "@/hooks/use-hydrated";
import { lineItemTotal } from "@/lib/cart-utils";
import { formatCurrency } from "@/lib/utils";

/** Cart button with a dropdown mini-cart: items, quantity steppers, checkout. */
export function CartMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const hydrated = useHydrated();

  const items = useCart((s) => s.items);
  const itemCount = useCart((s) => s.itemCount());
  const subtotal = useCart((s) => s.subtotal());
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Close when the route changes.
  useEffect(() => setOpen(false), [pathname]);

  const count = hydrated ? itemCount : 0;
  const showItems = hydrated && items.length > 0;

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="relative"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="View cart"
        onClick={() => setOpen((v) => !v)}
      >
        <ShoppingBag className="size-4" />
        <span className="hidden sm:inline">Cart</span>
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-primary-foreground">
            {count}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-elevated)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-ink">Your cart</p>
            <span className="text-xs text-muted-foreground">
              {count} item{count === 1 ? "" : "s"}
            </span>
          </div>

          {!showItems ? (
            <div className="px-4 py-8 text-center">
              <ShoppingBag className="mx-auto mb-2 size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Your cart is empty.</p>
              <Button asChild variant="outline" size="sm" className="mt-3" onClick={() => setOpen(false)}>
                <Link href="/">Browse the menu</Link>
              </Button>
            </div>
          ) : (
            <>
              <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-subtle">
                      <AppImage src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="48px" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-ink">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(lineItemTotal(item))}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name}`}
                          onClick={() =>
                            item.quantity <= 1
                              ? removeItem(item.id)
                              : updateQuantity(item.id, item.quantity - 1)
                          }
                          className="flex size-6 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-ink"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${item.name}`}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex size-6 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-ink"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => removeItem(item.id)}
                      className="shrink-0 text-muted-foreground transition-colors hover:text-rose-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border px-4 py-3">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-ink">{formatCurrency(subtotal)}</span>
                </div>
                <Button asChild className="w-full" onClick={() => setOpen(false)}>
                  <Link href="/checkout">Checkout · {formatCurrency(subtotal)}</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
