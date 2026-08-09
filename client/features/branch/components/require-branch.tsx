"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { Store } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranches } from "@/features/branch/hooks/use-branches";
import { useActiveBranch, isAllBranches } from "@/features/branch/hooks/use-active-branch";
import { usesBranchSwitcher } from "@/lib/permissions";
import type { StaffRole } from "@/lib/types";

interface RequireBranchProps {
  children: ReactNode;
  /** Short name of the gated feature, e.g. "The POS", "Table orders". */
  feature?: string;
  title?: string;
  description?: string;
}

/**
 * Branch-scoping gate. Renders `children` only when a **specific** branch is
 * selected in the topbar. While "All branches" (or nothing) is active it blocks
 * with a prompt + inline picker, because the wrapped feature ties its data to a
 * single branch (e.g. every POS order belongs to one location).
 *
 * Reusable — wrap any branch-scoped page:
 *   <RequireBranch feature="The POS"><PosTerminal /></RequireBranch>
 */
export function RequireBranch({
  children,
  feature = "This page",
  title,
  description,
}: RequireBranchProps) {
  const { branches, loading } = useBranches();
  const activeBranchId = useActiveBranch((s) => s.activeBranchId);
  const setActiveBranchId = useActiveBranch((s) => s.setActiveBranchId);
  const role = useParams()?.role as StaffRole | undefined;

  // Only multi-branch roles pick a branch; single-branch staff are never gated.
  if (!usesBranchSwitcher(role)) return <>{children}</>;

  const needsBranch = !activeBranchId || isAllBranches(activeBranchId);
  if (!needsBranch) return <>{children}</>;

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-tint text-brand-deep">
          <Store className="size-7" />
        </div>
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
          {title ?? "Select a branch to continue"}
        </h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description ??
            `${feature} works on one branch at a time — each order is tied to a single location. Choose a branch to continue.`}
        </p>

        <div className="mt-6 text-left">
          <label className="mb-1.5 block text-sm font-medium text-ink">Branch</label>
          {loading && !branches.length ? (
            <Skeleton className="h-10 w-full rounded-xl" />
          ) : branches.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
              No branches found. Add a branch first, then come back.
            </p>
          ) : (
            <Dropdown
              value=""
              onChange={(v) => setActiveBranchId(v)}
              searchable={branches.length > 8}
              placeholder="Choose a branch…"
              aria-label="Select a branch"
              options={branches.map((b) => ({
                value: b.id,
                label: b.name,
                sublabel: b.city || undefined,
              }))}
            />
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            You can switch branches anytime from the selector in the top bar.
          </p>
        </div>
      </Card>
    </div>
  );
}
