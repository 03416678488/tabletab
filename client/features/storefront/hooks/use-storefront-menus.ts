"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchStorefrontMenus,
  type StorefrontMenu,
} from "@/features/website-builder/services/storefront-menus";

/**
 * Cached named menus (each with its available dishes) for the website-builder
 * "Menu grid" block. Shares the storefront cache + SSE invalidation so the
 * builder blocks reconcile in real time like the rest of the menu.
 */
export function useStorefrontMenus() {
  const query = useQuery({
    queryKey: ["storefront", "menus"],
    queryFn: fetchStorefrontMenus,
    staleTime: 5 * 60_000,
  });
  const menus: StorefrontMenu[] = query.data ?? [];
  return { ...query, menus };
}
