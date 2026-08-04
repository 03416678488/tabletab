"use client";

import { useQuery } from "@tanstack/react-query";

import { menuService } from "@/features/menu/services/menu.service";
import type { MenuItem } from "@/features/menu/types/menu.types";

/** Query key for the full menu-items cache (invalidate to refetch). */
export const MENU_ITEMS_ALL_KEY = ["menu-items", "all"] as const;

const PER_PAGE = 500;

/** Fetch every menu item across all pages in one go (parallel after page 1). */
async function fetchAllMenuItems(): Promise<MenuItem[]> {
  const first = await menuService.list({ page: 1, perPage: PER_PAGE });
  const items = [...first.items];
  const totalPages = first.meta?.totalPages ?? 1;
  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        menuService.list({ page: i + 2, perPage: PER_PAGE }),
      ),
    );
    for (const r of rest) items.push(...r.items);
  }
  return items;
}

/**
 * The whole item catalog, cached (React Query). Callers filter by
 * category/search client-side for instant results — used by the POS terminal.
 */
export function useAllMenuItems() {
  return useQuery({ queryKey: MENU_ITEMS_ALL_KEY, queryFn: fetchAllMenuItems });
}
