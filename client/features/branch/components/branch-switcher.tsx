"use client";

import { useEffect } from "react";
import { ChevronDown, MapPin } from "lucide-react";

import { useBranches } from "@/features/branch/hooks/use-branches";
import { useActiveBranch } from "@/features/branch/hooks/use-active-branch";

/**
 * Admin topbar branch selector, backed by the real /branches API.
 */
export function BranchSwitcher() {
  const { branches, loading } = useBranches();
  const activeBranchId = useActiveBranch((s) => s.activeBranchId);
  const setActiveBranchId = useActiveBranch((s) => s.setActiveBranchId);

  // Default to the first branch once loaded (or if the saved one disappeared).
  useEffect(() => {
    if (!branches.length) return;
    const valid = branches.some((b) => b.id === activeBranchId);
    if (!valid) setActiveBranchId(branches[0].id);
  }, [branches, activeBranchId, setActiveBranchId]);

  const baseClass =
    "h-10 appearance-none rounded-xl border border-border bg-white pl-9 pr-9 text-sm font-medium text-ink shadow-sm outline-none transition-colors focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30";

  if (loading && !branches.length) {
    return (
      <div className="hidden h-10 w-40 animate-pulse rounded-xl border border-border bg-secondary sm:block" />
    );
  }

  if (!branches.length) {
    return (
      <span className="hidden items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-sm text-muted-foreground sm:flex">
        <MapPin className="size-4" /> No branches
      </span>
    );
  }

  return (
    <label className="relative hidden items-center sm:flex">
      <MapPin className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
      <select
        value={activeBranchId ?? branches[0].id}
        onChange={(e) => setActiveBranchId(e.target.value)}
        aria-label="Active branch"
        className={baseClass}
      >
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name.replace("Olive & Ash — ", "")}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted-foreground" />
    </label>
  );
}
