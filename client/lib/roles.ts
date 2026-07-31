import type { StaffRole } from "@/lib/types";

/**
 * Maps API role names (from the auth session's `roleNames`) to the frontend
 * StaffRole vocabulary used by the /app dashboard.
 *
 * The API has no dedicated "Owner" role, so Admin/Super Admin stand in as owner
 * (per product decision). Chef/Waiter don't exist in the API seed yet.
 */
const API_TO_STAFF_ROLE: Record<string, StaffRole> = {
  "Super Admin": "admin",
  Admin: "admin",
  Manager: "manager",
  Chef: "chef",
  Waiter: "waiter",
};

/** Highest-privilege role wins when a user holds several. */
const ROLE_PRIORITY = ["Super Admin", "Admin", "Manager", "Chef", "Waiter"];

export function mapApiRolesToStaffRole(roleNames: string[] = []): StaffRole {
  for (const apiRole of ROLE_PRIORITY) {
    if (roleNames.includes(apiRole) && API_TO_STAFF_ROLE[apiRole]) {
      return API_TO_STAFF_ROLE[apiRole];
    }
  }
  // Fallback for any authenticated staff whose role isn't mapped yet.
  return "admin";
}
