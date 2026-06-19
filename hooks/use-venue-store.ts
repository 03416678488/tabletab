import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  cartItemKey,
  cartSubtotal,
  cartTax,
  cartTotal,
  newCartItemId,
} from "@/lib/cart-utils";
import type { Branch, BuffetSelection, CartItem, Table } from "@/lib/types";
import { orderBuffetSubtotal } from "@/lib/buffet-utils";

interface VenueStore {
  qrToken: string | null;
  branchId: string | null;
  tableId: string | null;
  tableLabel: string | null;
  branchName: string | null;
  customerName: string;
  activeOrderId: string | null;
  items: CartItem[];
  buffet: BuffetSelection | null;
  cartOpen: boolean;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  initTable: (token: string, branch: Branch, table: Table) => void;
  setCustomerName: (name: string) => void;
  setActiveOrderId: (id: string | null) => void;
  setCartOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemNotes: (id: string, notes: string) => void;
  clearCart: () => void;
  setBuffet: (buffet: BuffetSelection | null) => void;
  itemCount: () => number;
  subtotal: () => number;
  tax: () => number;
  total: () => number;
}

export const useVenueStore = create<VenueStore>()(
  persist(
    (set, get) => ({
      qrToken: null,
      branchId: null,
      tableId: null,
      tableLabel: null,
      branchName: null,
      customerName: "",
      activeOrderId: null,
      items: [],
      buffet: null,
      cartOpen: false,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      initTable: (token, branch, table) => {
        const current = get().qrToken;
        if (current !== token) {
          set({
            qrToken: token,
            branchId: branch.id,
            tableId: table.id,
            tableLabel: table.label,
            branchName: branch.name,
            items: [],
            buffet: null,
            activeOrderId: null,
          });
        } else {
          set({
            qrToken: token,
            branchId: branch.id,
            tableId: table.id,
            tableLabel: table.label,
            branchName: branch.name,
          });
        }
      },

      setCustomerName: (name) => set({ customerName: name.trim() }),
      setActiveOrderId: (id) => set({ activeOrderId: id }),
      setCartOpen: (open) => set({ cartOpen: open }),

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

      updateItemNotes: (id, notes) => {
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, notes } : i)),
        });
      },

      clearCart: () => set({ items: [], buffet: null }),

      setBuffet: (buffet) => set({ buffet }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () => cartSubtotal(get().items) + orderBuffetSubtotal({ buffet: get().buffet ?? undefined }),

      tax: () => cartTax(cartSubtotal(get().items) + orderBuffetSubtotal({ buffet: get().buffet ?? undefined })),

      total: () => {
        const sub = cartSubtotal(get().items) + orderBuffetSubtotal({ buffet: get().buffet ?? undefined });
        const tax = cartTax(sub);
        return cartTotal(sub, 0, tax);
      },
    }),
    {
      name: "tabletap-venue",
      partialize: (s) => ({
        qrToken: s.qrToken,
        branchId: s.branchId,
        tableId: s.tableId,
        tableLabel: s.tableLabel,
        branchName: s.branchName,
        customerName: s.customerName,
        activeOrderId: s.activeOrderId,
        items: s.items,
        buffet: s.buffet,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
