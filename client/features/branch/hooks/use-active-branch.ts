"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * The branch currently selected in the admin topbar (real, API-backed branches).
 * Kept separate from the mock `useSession` branch context that the legacy
 * kitchen/manager/waiter boards still read.
 */

/** Sentinel selection meaning "all branches" (no single-branch scope). */
export const ALL_BRANCHES = "all";

/** True when the active selection is the cross-branch "All branches" view. */
export function isAllBranches(id: string | null): boolean {
  return id === ALL_BRANCHES;
}

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
