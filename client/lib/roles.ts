import type { StaffRole } from "@/lib/types";

/**
 * Every valid dashboard role segment. The dashboard lives under a root-level
 * `[role]` route, so this set is what tells a real role (→ staff dashboard)
 * apart from an arbitrary storefront page slug like `menu` (→ `/p/menu`).
 */
export const STAFF_ROLES: readonly StaffRole[] = [
  "owner",
  "multi_branch_manager",
  "branch_manager",
  "chef",
  "waiter",
  "delivery",
];

export function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

/**
 * Maps API role names (from the auth session's `roleNames`) to the frontend
 * StaffRole vocabulary used by the /app dashboard.
 */
const API_TO_STAFF_ROLE: Record<string, StaffRole> = {
  Owner: "owner",
  "Multi Branch Manager": "multi_branch_manager",
  "Branch Manager": "branch_manager",
  Chef: "chef",
  Waiter: "waiter",
  "Delivery Rider": "delivery",
};

/** Highest-privilege role wins when a user holds several. */
const ROLE_PRIORITY = [
  "Owner",
  "Multi Branch Manager",
  "Branch Manager",
  "Chef",
  "Waiter",
  "Delivery Rider",
];

export function mapApiRolesToStaffRole(roleNames: string[] = []): StaffRole {
  for (const apiRole of ROLE_PRIORITY) {
    if (roleNames.includes(apiRole) && API_TO_STAFF_ROLE[apiRole]) {
      return API_TO_STAFF_ROLE[apiRole];
    }
  }
  // Fallback for any authenticated staff whose role isn't mapped yet.
  return "owner";
}
