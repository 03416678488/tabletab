"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { signOut } from "next-auth/react";
import { getSettingsSnapshot } from "@/hooks/use-settings-store";
import type { Branch, StaffUser } from "@/lib/types";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Staff session state for the /app shell.
 *
 * The authenticated user + status are sourced from the real NextAuth session
 * (pushed in by <SessionSync/>), not a mock. Branch selection is local UI state
 * that isn't part of the auth session, so it stays here.
 */
interface SessionStore {
  user: StaffUser | null;
  status: SessionStatus;
  isAuthenticated: boolean;
  activeBranch: Branch;
  branches: Branch[];
  /** Called by <SessionSync/> whenever the NextAuth session changes. */
  setSession: (user: StaffUser | null, status: SessionStatus) => void;
  setActiveBranch: (branchId: string) => void;
  logout: () => void;
}

function sessionBranches() {
  return getSettingsSnapshot().branches;
}

export const useSession = create<SessionStore>()(
  persist(
    (set) => ({
      user: null,
      status: "loading",
      isAuthenticated: false,
      activeBranch: sessionBranches()[0],
      branches: sessionBranches(),

      setSession: (user, status) => {
        const branches = sessionBranches();
        set((prev) => {
          // Keep the previously selected branch if it's still valid, else pick
          // the first the user can access (owners implicitly see all).
          const current = branches.find((b) => b.id === prev.activeBranch?.id);
          const accessible =
            user && user.branchIds.length
              ? branches.find((b) => user.branchIds.includes(b.id))
              : undefined;
          return {
            user,
            status,
            isAuthenticated: status === "authenticated" && !!user,
            branches,
            activeBranch: current ?? accessible ?? branches[0],
          };
        });
      },

      setActiveBranch: (branchId) => {
        const branches = sessionBranches();
        const next = branches.find((b) => b.id === branchId);
        if (next) set({ activeBranch: next, branches });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, status: "unauthenticated" });
        void signOut({ callbackUrl: "/login" });
      },
    }),
    {
      name: "tabletap-staff",
      // Only branch selection is persisted; auth comes from NextAuth each load.
      partialize: (state) => ({ activeBranch: state.activeBranch }),
    },
  ),
);
