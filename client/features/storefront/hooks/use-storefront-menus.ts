"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchStorefrontMenus,
  type StorefrontMenu,
} from "@/features/website-builder/services/storefront-menus";
import { useLocationStore } from "@/hooks/use-location-store";

/**
 * Cached named menus (each with its available dishes) for the Menu grid/slider
 * blocks. Scoped to the selected branch — menus are per-branch, so without this
 * the slider shows every branch's menus (duplicate "Breakfast", "Lunch", …).
 */
export function useStorefrontMenus() {
  const branchId = useLocationStore((s) => s.branchId);
  const query = useQuery({
    queryKey: ["storefront", "menus", branchId ?? ""],
    queryFn: () => fetchStorefrontMenus(branchId),
    staleTime: 5 * 60_000,
  });
  const menus: StorefrontMenu[] = query.data ?? [];
  return { ...query, menus };
}
