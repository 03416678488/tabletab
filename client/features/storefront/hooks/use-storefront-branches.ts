"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStorefrontBranches } from "@/features/storefront/services/storefront-branches";
import type { Branch } from "@/lib/types";

/** Cached list of live storefront branches (shared across storefront pages). */
export function useStorefrontBranches() {
  const query = useQuery({
    queryKey: ["storefront", "branches"],
    queryFn: fetchStorefrontBranches,
    staleTime: 5 * 60_000,
  });
  const branches: Branch[] = query.data ?? [];
  return { ...query, branches };
}
