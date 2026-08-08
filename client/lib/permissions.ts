import type { StaffRole } from "@/lib/types";
import { STAFF_ROLES } from "@/lib/roles";

/**
 * Role → route authorization matrix. Single source of truth for *who may open
 * which dashboard page*, enforced server-side in `proxy.ts` and client-side in
 * `StaffAuthGuard`. Icon-free so it is safe to import from the edge proxy.
 *
 * The nav in `lib/nav.ts` renders from the same role groups below, so the menu
 * a user sees and the pages they can actually reach stay in agreement. When you
 * add a page under `app/(dashboard)/[role]/<slug>/`, add its `<slug>` here.
 */

export const ALL_ROLES: StaffRole[] = [...STAFF_ROLES];
/** Management tier: owner + both manager roles. */
export const MANAGER_ROLES: StaffRole[] = [
  "owner",
  "multi_branch_manager",
  "branch_manager",
];
/** Top-admin only. */
export const OWNER_ROLES: StaffRole[] = ["owner"];

/** Allowed roles per first path segment after `/{role}/`. Covers every route
 *  under `app/(dashboard)/[role]/*`. */
export const ROUTE_ROLES: Record<string, StaffRole[]> = {
  // Operations
  dashboard: ALL_ROLES,
  notifications: ALL_ROLES,
  deliveries: [...MANAGER_ROLES, "delivery"],
  kitchen: [...MANAGER_ROLES, "chef"],
  kds: [...MANAGER_ROLES, "chef"],
  waiter: [...MANAGER_ROLES, "waiter"],
  manager: MANAGER_ROLES,
  tables: [...MANAGER_ROLES, "waiter"],
  oss: MANAGER_ROLES,

  // POS & Orders
  pos: [...MANAGER_ROLES, "waiter"],
  "pos-orders": [...MANAGER_ROLES, "waiter"],
  "table-orders": [...MANAGER_ROLES, "waiter"],
  "online-orders": MANAGER_ROLES,

  // Finance
  reports: MANAGER_ROLES,
  transactions: MANAGER_ROLES,
  "cash-register": MANAGER_ROLES,
  income: MANAGER_ROLES,
  "income-categories": MANAGER_ROLES,
  expense: MANAGER_ROLES,
  "expense-categories": MANAGER_ROLES,

  // Management
  menus: MANAGER_ROLES,
  menu: MANAGER_ROLES,
  "menu-io": MANAGER_ROLES,
  categories: MANAGER_ROLES,
  "food-types": MANAGER_ROLES,
  areas: MANAGER_ROLES,
  "tables-list": MANAGER_ROLES,
  "qr-codes": MANAGER_ROLES,
  vat: MANAGER_ROLES,
  "vat-groups": MANAGER_ROLES,
  branches: MANAGER_ROLES,
  promotions: MANAGER_ROLES,
  campaigns: MANAGER_ROLES,
  marketplace: OWNER_ROLES,
  settings: OWNER_ROLES,
  "website-settings": OWNER_ROLES,

  // Users (owner-only)
  roles: OWNER_ROLES,
  owners: OWNER_ROLES,
  "multi-branch-managers": OWNER_ROLES,
  "branch-managers": OWNER_ROLES,
  chefs: OWNER_ROLES,
  waiters: OWNER_ROLES,
  "delivery-riders": OWNER_ROLES,
  customers: OWNER_ROLES,
};

/** Default landing route after login for each role: `/{role}/dashboard`. */
export function homePathForRole(role: StaffRole): string {
  return `/${role}/dashboard`;
}

/**
 * May a user of `role` open `/{role}/{slug}`? An empty slug is the dashboard.
 * Unknown slugs (not in the matrix) are allowed for any signed-in staff — the
 * role-segment match is still enforced separately — so a page missing from the
 * matrix 404s rather than being hard-locked out for everyone.
 */
export function canAccessSlug(role: StaffRole, slug: string): boolean {
  const key = slug || "dashboard";
  const allowed = ROUTE_ROLES[key];
  if (!allowed) return true;
  return allowed.includes(role);
}

/**
 * Where a `role` user requesting page `slug` should actually land: their own
 * namespace + that page when permitted, otherwise their dashboard.
 */
export function resolveAllowedPath(role: StaffRole, slug: string): string {
  return canAccessSlug(role, slug)
    ? `/${role}/${slug || "dashboard"}`
    : homePathForRole(role);
}
