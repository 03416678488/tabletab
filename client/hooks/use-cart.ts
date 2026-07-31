"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  cartItemKey,
  cartSubtotal,
  cartTax,
  cartTotal,
  lineItemTotal,
  newCartItemId,
} from "@/lib/cart-utils";
import type { CartItem, FulfillmentType } from "@/lib/types";

interface CartStore {
  branchId: string | null;
  fulfillmentType: FulfillmentType;
  items: CartItem[];
  setBranch: (branchId: string) => void;
  setFulfillmentType: (type: FulfillmentType) => void;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  itemCount: () => number;
  subtotal: () => number;
  tax: () => number;
  totalWithFees: (deliveryFee: number) => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      branchId: null,
      fulfillmentType: "pickup",
      items: [],

      setBranch: (branchId) => {
        const current = get().branchId;
        if (current && current !== branchId) {
          set({ branchId, items: [] });
        } else {
          set({ branchId });
        }
      },

      setFulfillmentType: (fulfillmentType) => set({ fulfillmentType }),

      addItem: (item) => {
        const key = cartItemKey(item.menuItemId, item.modifiers, item.notes);
        const existing = get().items.find(
          (i) => cartItemKey(i.menuItemId, i.modifiers, i.notes) === key,
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i,
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, id: newCartItemId() }] });
        }
      },

      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        });
      },

      clear: () => set({ items: [], branchId: null }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () => cartSubtotal(get().items),

      tax: () => cartTax(cartSubtotal(get().items)),

      totalWithFees: (deliveryFee) =>
        cartTotal(cartSubtotal(get().items), deliveryFee, cartTax(cartSubtotal(get().items))),
    }),
    { name: "tabletap-cart" },
  ),
);

export { lineItemTotal };
