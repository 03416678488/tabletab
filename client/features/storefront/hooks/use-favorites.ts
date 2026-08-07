"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCustomerSession } from "@/hooks/use-customer-session";
import {
  addFavoriteRemote,
  removeFavoriteRemote,
} from "@/features/storefront/services/favorites";

/**
 * Storefront favorites, backed by the API and mirrored locally.
 *
 * The backend (`/customer-favorites`) is the source of truth; this store keeps a
 * per-customer local cache so the UI is instant and survives reloads offline.
 * Toggles apply optimistically, then sync — reconciling to the server's list on
 * success and reverting on failure. Keyed by customer id so a shared device
 * never leaks one customer's saves to another.
 */
interface FavoritesStore {
  byCustomer: Record<string, string[]>;
  /** Toggle an item for a customer; returns the new favorited state. */
  toggle: (customerId: string, itemId: string) => boolean;
  isFavorite: (customerId: string, itemId: string) => boolean;
  list: (customerId: string) => string[];
  /** Replace a customer's list — used to hydrate from the server. */
  setFavorites: (customerId: string, itemIds: string[]) => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      byCustomer: {},

      setFavorites: (customerId, itemIds) =>
        set({ byCustomer: { ...get().byCustomer, [customerId]: itemIds } }),

      toggle: (customerId, itemId) => {
        const current = get().byCustomer[customerId] ?? [];
        const has = current.includes(itemId);
        const next = has ? current.filter((id) => id !== itemId) : [...current, itemId];
        // Optimistic local update.
        set({ byCustomer: { ...get().byCustomer, [customerId]: next } });

        // Sync to the backend when signed in; reconcile to its truth, or revert.
        const token = useCustomerSession.getState().token;
        if (token) {
          const op = has ? removeFavoriteRemote : addFavoriteRemote;
          op(token, itemId)
            .then((serverIds) =>
              set({ byCustomer: { ...get().byCustomer, [customerId]: serverIds } }),
            )
            .catch(() =>
              set({ byCustomer: { ...get().byCustomer, [customerId]: current } }),
            );
        }
        return !has;
      },

      isFavorite: (customerId, itemId) => (get().byCustomer[customerId] ?? []).includes(itemId),
      list: (customerId) => get().byCustomer[customerId] ?? [],
    }),
    { name: "tabletap.favorites" },
  ),
);
