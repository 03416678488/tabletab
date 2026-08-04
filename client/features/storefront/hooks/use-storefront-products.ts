"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStorefrontProducts } from "@/features/storefront/services/storefront-catalog";
import type { MenuItem } from "@/lib/types";

/**
 * Cached flat list of all available products (up to the catalog cap). For the
 * branch menu + product-detail related items; the paged catalog uses
 * `useCatalogInfinite` instead.
 */
export function useStorefrontProducts() {
  const query = useQuery({
    queryKey: ["storefront", "products"],
    queryFn: fetchStorefrontProducts,
    staleTime: 5 * 60_000,
  });
  const products: MenuItem[] = query.data ?? [];
  return { ...query, products };
}
