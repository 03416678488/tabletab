"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStorefrontProducts } from "@/features/storefront/services/storefront-catalog";
import { useI18n } from "@/features/i18n/i18n-provider";
import type { MenuItem } from "@/lib/types";

/**
 * Cached flat list of all available products (up to the catalog cap). For the
 * branch menu + product-detail related items; the paged catalog uses
 * `useCatalogInfinite` instead.
 */
export function useStorefrontProducts() {
  const { def } = useI18n();
  const query = useQuery({
    queryKey: ["storefront", "products", def.language],
    queryFn: fetchStorefrontProducts,
    staleTime: 5 * 60_000,
  });
  const products: MenuItem[] = query.data ?? [];
  return { ...query, products };
}
