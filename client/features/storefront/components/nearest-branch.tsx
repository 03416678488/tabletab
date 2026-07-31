"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocationStore } from "@/hooks/use-location-store";
import { api } from "@/lib/api";
import type { Branch } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Picks the branch to surface as "nearest".
 *
 * TODO(maps): once the Google Maps API is wired up, replace this with a real
 * distance calc against the user's geolocation. For now we default to the first
 * open branch (falling back to the first branch) so the nav has a graceful,
 * non-empty state.
 */
function pickNearest(branches: Branch[]): Branch | null {
  if (branches.length === 0) return null;
  return branches.find((b) => b.isOpen) ?? branches[0];
}

// Module-level cache so every mounted header shares one fetch.
let branchesPromise: Promise<Branch[]> | null = null;
function loadBranches() {
  if (!branchesPromise) branchesPromise = api.getBranches();
  return branchesPromise;
}

interface NearestBranchProps {
  /** "inline" = compact pill for the desktop header; "bar" = full-width mobile bar. */
  variant?: "inline" | "bar";
  className?: string;
}

/** Shows the user's nearest branch in the nav, linking to the location picker. */
export function NearestBranch({ variant = "inline", className }: NearestBranchProps) {
  const selectedBranchId = useLocationStore((s) => s.branchId);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadBranches()
      .then((list) => {
        if (cancelled) return;
        // Prefer the branch the user chose on the landing; else best guess.
        const chosen = selectedBranchId
          ? list.find((b) => b.id === selectedBranchId)
          : undefined;
        setBranch(chosen ?? pickNearest(list));
      })
      .catch(() => {
        /* leave branch null — widget hides itself */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBranchId]);

  if (loading) {
    return variant === "bar" ? (
      <div className={cn("flex items-center gap-2 px-4 py-2", className)}>
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
    ) : (
      <Skeleton className={cn("h-9 w-44 rounded-full", className)} />
    );
  }

  if (!branch) return null;

  if (variant === "bar") {
    return (
      <Link
        href="/order"
        className={cn(
          "flex items-center gap-2.5 border-t border-border bg-surface px-4 py-2.5 text-left",
          className,
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
          <MapPin className="size-4" />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Nearest branch
          </span>
          <span className="truncate text-sm font-semibold text-ink">{branch.name}</span>
        </span>
        <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </Link>
    );
  }

  return (
    <Link
      href="/order"
      className={cn(
        "group flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1.5 transition-colors hover:border-brand/40 hover:bg-brand-tint/40",
        className,
      )}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
        <MapPin className="size-4" />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Nearest branch
        </span>
        <span className="max-w-[10rem] truncate text-sm font-semibold text-ink">
          {branch.name}
        </span>
      </span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-ink" />
    </Link>
  );
}
