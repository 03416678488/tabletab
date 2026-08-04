"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStorefrontCategories } from "@/features/storefront/services/storefront-catalog";
import type { MenuCategory } from "@/lib/types";

/** Cached storefront menu categories (shared across storefront pages). */
export function useStorefrontCategories() {
  const query = useQuery({
    queryKey: ["storefront", "categories"],
    queryFn: fetchStorefrontCategories,
    staleTime: 5 * 60_000,
  });
  const categories: MenuCategory[] = query.data ?? [];
  return { ...query, categories };
}
