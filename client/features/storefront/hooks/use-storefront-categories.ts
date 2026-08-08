"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStorefrontCategories } from "@/features/storefront/services/storefront-catalog";
import { useI18n } from "@/features/i18n/i18n-provider";
import type { MenuCategory } from "@/lib/types";

/** Cached storefront menu categories (shared across storefront pages). */
export function useStorefrontCategories() {
  // Language in the key so switching language refetches translated names.
  const { def } = useI18n();
  const query = useQuery({
    queryKey: ["storefront", "categories", def.language],
    queryFn: fetchStorefrontCategories,
    staleTime: 5 * 60_000,
  });
  const categories: MenuCategory[] = query.data ?? [];
  return { ...query, categories };
}
