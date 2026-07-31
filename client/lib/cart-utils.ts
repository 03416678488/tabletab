import type { CartItem, CartItemModifier } from "@/lib/types";

export const TAX_RATE = 0.08;

export function lineItemUnitPrice(item: CartItem): number {
  const mods = item.modifiers.reduce((sum, m) => sum + m.priceDelta, 0);
  return item.unitPrice + mods;
}

export function lineItemTotal(item: CartItem): number {
  return lineItemUnitPrice(item) * item.quantity;
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + lineItemTotal(item), 0);
}

export function cartTax(subtotal: number): number {
  return Math.round(subtotal * TAX_RATE * 100) / 100;
}

export function cartTotal(subtotal: number, deliveryFee: number, tax: number): number {
  return Math.round((subtotal + deliveryFee + tax) * 100) / 100;
}

export function cartItemKey(menuItemId: string, modifiers: CartItemModifier[], notes?: string) {
  const modKey = modifiers
    .map((m) => m.optionId)
    .sort()
    .join(",");
  return `${menuItemId}:${modKey}:${notes ?? ""}`;
}

export function newCartItemId() {
  return `ci-${Math.random().toString(36).slice(2, 10)}`;
}
