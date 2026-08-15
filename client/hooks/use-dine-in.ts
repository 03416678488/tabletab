"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Active QR dine-in session. Set when a customer scans a table QR (`/t/{slug}`);
 * it locks the storefront to that branch + table so checkout places a dine-in
 * ("table") order instead of delivery/pickup. Persisted so a page refresh mid-
 * order keeps the table context.
 */
interface DineInStore {
  active: boolean;
  slug: string | null;
  branchId: string | null;
  branchName: string | null;
  tableId: string | null;
  tableName: string | null;
  /** Per-sitting token, issued by the first order; required to add more rounds. */
  sessionToken: string | null;

  start: (session: {
    slug: string;
    branchId: string;
    branchName: string;
    tableId: string;
    tableName: string;
  }) => void;
  setSessionToken: (token: string | null) => void;
  clear: () => void;
}

export const useDineIn = create<DineInStore>()(
  persist(
    (set) => ({
      active: false,
      slug: null,
      branchId: null,
      branchName: null,
      tableId: null,
      tableName: null,
      sessionToken: null,

      // Scanning (re)starts a sitting: drop any token from a previous one.
      start: (session) => set({ active: true, sessionToken: null, ...session }),
      setSessionToken: (sessionToken) => set({ sessionToken }),
      clear: () =>
        set({
          active: false,
          slug: null,
          branchId: null,
          branchName: null,
          tableId: null,
          tableName: null,
          sessionToken: null,
        }),
    }),
    { name: "tabletab-dinein" },
  ),
);
