"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchActivePromotions } from "@/features/promotion/services/storefront-promotions";
import type { Promotion } from "@/features/promotion/types/promotion.types";

/** Cached list of live promotions — shared by storefront sliders and the
 *  website-builder link picker. Fails soft (empty) if none / not migrated. */
export function useActivePromotions() {
  const query = useQuery({
    queryKey: ["promotions", "active"],
    queryFn: fetchActivePromotions,
    staleTime: 5 * 60_000,
  });
  const promotions: Promotion[] = query.data ?? [];
  return { ...query, promotions };
}
