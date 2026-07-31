import { create } from "zustand";
import { persist } from "zustand/middleware";
import { staffUsers as initialStaff } from "@/lib/mock/staff";
import type { StaffRole, StaffUser } from "@/lib/types";

export interface StaffInviteInput {
  name: string;
  email: string;
  role: StaffRole;
  branchIds: string[];
}

interface StaffStore {
  staff: StaffUser[];
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  inviteStaff: (input: StaffInviteInput) => StaffUser;
  toggleActive: (id: string) => void;
  updateStaff: (id: string, patch: Partial<StaffInviteInput>) => void;
}

const withDefaults = (users: StaffUser[]): StaffUser[] =>
  users.map((u) => ({ ...u, active: u.active ?? true }));

export const useStaffStore = create<StaffStore>()(
  persist(
    (set, get) => ({
      staff: withDefaults(initialStaff),
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      inviteStaff: (input) => {
        const user: StaffUser = {
          id: `su-${Date.now()}`,
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          role: input.role,
          branchIds: input.branchIds,
          avatarUrl: `https://i.pravatar.cc/120?u=tabletap-${Date.now()}`,
          active: true,
          invitedAt: new Date().toISOString(),
        };
        set({ staff: [...get().staff, user] });
        return user;
      },

      toggleActive: (id) => {
        set({
          staff: get().staff.map((s) =>
            s.id === id ? { ...s, active: !(s.active ?? true) } : s,
          ),
        });
      },

      updateStaff: (id, patch) => {
        set({
          staff: get().staff.map((s) =>
            s.id === id
              ? {
                  ...s,
                  ...(patch.name !== undefined && { name: patch.name.trim() }),
                  ...(patch.email !== undefined && { email: patch.email.trim().toLowerCase() }),
                  ...(patch.role !== undefined && { role: patch.role }),
                  ...(patch.branchIds !== undefined && { branchIds: patch.branchIds }),
                }
              : s,
          ),
        });
      },
    }),
    {
      name: "tabletap-staff-admin",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function getStaffSnapshot() {
  return useStaffStore.getState();
}
