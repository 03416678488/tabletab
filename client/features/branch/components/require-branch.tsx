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
 * Branch-scoping gate. Shows a **non-dismissible popup** (no close ✕, no
 * backdrop/Esc dismiss) whenever no specific branch is selected in the topbar.
 * The popup does one thing: set the active branch. Everything downstream already
 * watches the active branch (`useScopedBranchId`), so once it changes the popup
 * disappears and the page re-scopes itself.
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
  const needsBranch =
    usesBranchSwitcher(role) && (!activeBranchId || isAllBranches(activeBranchId));

  return (
    <>
      {/* Keep the page mounted underneath so it renders once (while the popup is
          up) instead of rebuilding from scratch on every selection — picking a
          branch then just drops the overlay to reveal an already-rendered page. */}
      {children}

      {needsBranch && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title ?? "Select a branch to continue"}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
        >
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
      )}
    </>
  );
}
