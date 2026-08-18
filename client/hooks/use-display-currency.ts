"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * The visitor's chosen *display* currency on the storefront. `code` null = show
 * prices in the tenant's Default currency. Conversion is display-only — orders
 * are still priced and charged in the base currency.
 */
interface DisplayCurrencyStore {
  code: string | null;
  setCode: (code: string | null) => void;
}

export const useDisplayCurrency = create<DisplayCurrencyStore>()(
  persist(
    (set) => ({
      code: null,
      setCode: (code) => set({ code }),
    }),
    { name: "tabletab-display-currency" },
  ),
);
