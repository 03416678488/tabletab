"use client";

import { useParams } from "next/navigation";

import { useActiveBranch, isAllBranches } from "@/features/branch/hooks/use-active-branch";
import { useSessionUser } from "@/features/auth/hooks/use-session-user";
import { usesBranchSwitcher } from "@/lib/permissions";
import type { StaffRole } from "@/lib/types";

/**
 * The branch id the current user's views should be scoped to (and new records
 * tagged with):
 *
 * - **Multi-branch roles** (owner / multi-branch manager) follow the topbar
 *   branch switcher; "All branches" → `undefined` (no filter).
 * - **Single-branch staff** (branch manager, chef, waiter, delivery) are pinned
 *   to their assigned home branch from the session; `undefined` if unassigned.
 *
 * Use this instead of reading `useActiveBranch` directly in any branch-scoped
 * staff-facing view or create flow.
 */
export function useScopedBranchId(): string | undefined {
  const role = useParams()?.role as StaffRole | undefined;
  const activeBranchId = useActiveBranch((s) => s.activeBranchId);
  const user = useSessionUser();

  if (usesBranchSwitcher(role)) {
    return activeBranchId && !isAllBranches(activeBranchId) ? activeBranchId : undefined;
  }
  return user?.branchId ?? undefined;
}
