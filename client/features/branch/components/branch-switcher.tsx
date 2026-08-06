"use client";

import { useEffect } from "react";
import { MapPin } from "lucide-react";

import { Dropdown } from "@/components/ui/dropdown";
import { useBranches } from "@/features/branch/hooks/use-branches";
import { useActiveBranch } from "@/features/branch/hooks/use-active-branch";

/**
 * Topbar branch selector (owner / multi-branch manager only), backed by the
 * real /branches API. Uses the shared `Dropdown` for a consistent look with POS.
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

  if (loading && !branches.length) {
    return (
      <div className="hidden h-10 w-52 animate-pulse rounded-xl border border-border bg-secondary sm:block" />
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
    <div className="hidden sm:block">
      <Dropdown
        className="w-52"
        value={activeBranchId ?? branches[0].id}
        onChange={setActiveBranchId}
        searchable={branches.length > 8}
        aria-label="Active branch"
        options={branches.map((b) => ({
          value: b.id,
          label: b.name.replace("Olive & Ash — ", ""),
          sublabel: b.city || undefined,
        }))}
      />
    </div>
  );
}
