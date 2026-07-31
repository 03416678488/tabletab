"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * The branch currently selected in the admin topbar (real, API-backed branches).
 * Kept separate from the mock `useSession` branch context that the legacy
 * kitchen/manager/waiter boards still read.
 */
interface ActiveBranchStore {
  activeBranchId: string | null;
  setActiveBranchId: (id: string) => void;
}

export const useActiveBranch = create<ActiveBranchStore>()(
  persist(
    (set) => ({
      activeBranchId: null,
      setActiveBranchId: (id) => set({ activeBranchId: id }),
    }),
    { name: "tabletap-active-branch" },
  ),
);
