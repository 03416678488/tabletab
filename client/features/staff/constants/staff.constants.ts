import type { StaffRole } from "@/lib/types";

export const STAFF_ENDPOINTS = {
  base: "/staff",
  byId: (id: string) => `/staff/${id}`,
} as const;

/** Roles a staff member can be assigned (matches the API StaffRoleEnum). */
export const STAFF_ROLES: StaffRole[] = ["admin", "manager", "chef", "waiter"];
