"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStorefrontCategories } from "@/features/storefront/services/storefront-catalog";
import type { MenuCategory } from "@/lib/types";
import { useLocationStore } from "@/hooks/use-location-store";

/** Cached storefront menu categories (shared across storefront pages). */
export function useStorefrontCategories() {
  const branchId = useLocationStore((s) => s.branchId);
  const query = useQuery({
    queryKey: ["storefront", "categories", branchId ?? ""],
    queryFn: () => fetchStorefrontCategories(branchId),
    staleTime: 5 * 60_000,
  });
  const categories: MenuCategory[] = query.data ?? [];
  return { ...query, categories };
}
