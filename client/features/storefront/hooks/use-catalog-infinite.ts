"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchStorefrontProductsPage } from "@/features/storefront/services/storefront-catalog";
import { useI18n } from "@/features/i18n/i18n-provider";
import type { MenuItem } from "@/lib/types";

const PER_PAGE = 48;

export interface CatalogFilters {
  search: string;
  categoryIds: string[];
  minPrice?: number;
  maxPrice?: number;
}

export interface CatalogInfinite {
  items: MenuItem[];
  /** Total matching items on the server (across all pages). */
  total: number;
  /** True while the first page or the next page is loading. */
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
}

/**
 * Server-driven infinite scroll for the storefront catalog, backed by React
 * Query's `useInfiniteQuery`. Search, multi-category and price range are pushed
 * to the API (so filtering is correct across *all* items, not just loaded ones);
 * pages accumulate and are cached per query key, so revisiting a previous filter
 * set is instant.
 */
export function useCatalogInfinite(filters: CatalogFilters): CatalogInfinite {
  const search = filters.search.trim();
  // Sort so key is order-independent (same set of categories → same cache entry).
  const categoryIds = [...filters.categoryIds].sort();
  const { minPrice, maxPrice } = filters;
  // Language is part of the key so switching language refetches translated text.
  const { def } = useI18n();

  const query = useInfiniteQuery({
    queryKey: [
      "storefront",
      "catalog",
      def.language,
      search,
      categoryIds.join(","),
      minPrice ?? "",
      maxPrice ?? "",
    ],
    queryFn: ({ pageParam }) =>
      fetchStorefrontProductsPage({
        page: pageParam,
        perPage: PER_PAGE,
        search,
        categoryIds,
        minPrice,
        maxPrice,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.currentPage < last.totalPages ? last.currentPage + 1 : undefined,
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return {
    items,
    total: query.data?.pages[0]?.totalItems ?? 0,
    loading: query.isLoading || query.isFetchingNextPage,
    error: query.isError ? "Could not load the menu. Please try again." : null,
    hasMore: Boolean(query.hasNextPage),
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
    reload: () => void query.refetch(),
  };
}
