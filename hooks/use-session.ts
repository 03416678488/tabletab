"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getSettingsSnapshot } from "@/hooks/use-settings-store";
import { staffUsers } from "@/lib/mock";
import type { Branch, StaffRole, StaffUser } from "@/lib/types";

/**
 * Staff session state (frontend phase).
 * Holds the signed-in user + active branch context for the /app shell.
 */
interface SessionStore {
  user: StaffUser | null;
  activeBranch: Branch;
  branches: Branch[];
  isAuthenticated: boolean;
  login: (role: StaffRole) => void;
  logout: () => void;
  setRole: (role: StaffRole) => void;
  setActiveBranch: (branchId: string) => void;
}

function userForRole(role: StaffRole): StaffUser {
  const match = staffUsers.find((u) => u.role === role);
  if (match) return match;
  return { ...staffUsers[0], role };
}

function sessionBranches() {
  return getSettingsSnapshot().branches;
}

export const useSession = create<SessionStore>()(
  persist(
    (set, get) => ({
      user: null,
      activeBranch: sessionBranches()[0],
      branches: sessionBranches(),
      isAuthenticated: false,

      login: (role) => {
        const branches = sessionBranches();
        const user = userForRole(role);
        const branch =
          branches.find((b) => user.branchIds.includes(b.id)) ?? branches[0];
        set({ user, activeBranch: branch, branches, isAuthenticated: true });
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      setRole: (role) => {
        const user = userForRole(role);
        set({ user, isAuthenticated: true });
      },

      setActiveBranch: (branchId) => {
        const branches = sessionBranches();
        const next = branches.find((b) => b.id === branchId);
        if (next) set({ activeBranch: next, branches });
      },
    }),
    {
      name: "tabletap-staff",
      partialize: (state) => ({
        user: state.user,
        activeBranch: state.activeBranch,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
