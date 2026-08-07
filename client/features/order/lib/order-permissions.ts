import type { StaffRole } from "@/lib/types";

/**
 * Client mirror of the backend order-status policy (api order-status.policy.ts),
 * used to hide actions a role can't perform. The backend still enforces this —
 * this is UX only.
 *
 * - Status: Owner / Multi-Branch / Branch Manager / Waiter / Delivery Rider may
 *   set any status; Chef owns the kitchen pipeline up to ready
 *   (`confirmed`, `preparing`, `ready`) — not the post-ready handoff.
 * - Payment (mark paid): same set, but NOT the Chef.
 */
const FULL_STATUS_ROLES: StaffRole[] = [
  "owner",
  "multi_branch_manager",
  "branch_manager",
  "waiter",
  "delivery",
];

const PAYMENT_ROLES: StaffRole[] = [
  "owner",
  "multi_branch_manager",
  "branch_manager",
  "waiter",
  "delivery",
];

// Kept as strings so either OrderStatus type (feature vs lib) can be passed.
const CHEF_STATUSES = new Set<string>(["confirmed", "preparing", "ready"]);

export function canSetOrderStatus(role: StaffRole | undefined | null, status: string): boolean {
  if (!role) return false;
  if (FULL_STATUS_ROLES.includes(role)) return true;
  if (role === "chef") return CHEF_STATUSES.has(status);
  return false;
}

export function canMarkOrderPaid(role: StaffRole | undefined | null): boolean {
  return !!role && PAYMENT_ROLES.includes(role);
}
