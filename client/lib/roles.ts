import type { StaffRole } from "@/lib/types";

/**
 * Every valid dashboard role segment. The dashboard lives under a root-level
 * `[role]` route, so this set is what tells a real role (→ staff dashboard)
 * apart from an arbitrary storefront page slug like `menu` (→ `/p/menu`).
 */
export const STAFF_ROLES: readonly StaffRole[] = [
  "admin",
  "manager",
  "chef",
  "waiter",
  "delivery",
];

export function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

/**
 * Maps API role names (from the auth session's `roleNames`) to the frontend
 * StaffRole vocabulary used by the /app dashboard. The seed uses plural role
 * names (`Waiters`, `Chefs`, `Delivery Boys`); singular aliases are kept too.
 */
const API_TO_STAFF_ROLE: Record<string, StaffRole> = {
  "Super Admin": "admin",
  Admin: "admin",
  Administrators: "manager",
  Manager: "manager",
  Chefs: "chef",
  Chef: "chef",
  Waiters: "waiter",
  Waiter: "waiter",
  "Delivery Boys": "delivery",
};

/** Highest-privilege role wins when a user holds several. */
const ROLE_PRIORITY = [
  "Super Admin",
  "Admin",
  "Administrators",
  "Manager",
  "Chefs",
  "Chef",
  "Waiters",
  "Waiter",
  "Delivery Boys",
];

export function mapApiRolesToStaffRole(roleNames: string[] = []): StaffRole {
  for (const apiRole of ROLE_PRIORITY) {
    if (roleNames.includes(apiRole) && API_TO_STAFF_ROLE[apiRole]) {
      return API_TO_STAFF_ROLE[apiRole];
    }
  }
  // Fallback for any authenticated staff whose role isn't mapped yet.
  return "admin";
}
