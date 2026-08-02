"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { menuService } from "@/features/menu/services/menu.service";
import type { MenuItem } from "@/features/menu/types/menu.types";

interface Params {
  categoryId?: string;
  search?: string;
  perPage?: number;
}

/**
 * Lazily loads menu items page-by-page (server-side filtered by category/search).
 * Call `loadMore` — e.g. from an IntersectionObserver sentinel — to fetch the next page.
 */
export function usePaginatedMenuItems({ categoryId, search, perPage = 12 }: Params) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = `${categoryId ?? ""}|${search ?? ""}`;
  // Guards against out-of-order responses when the filter key changes mid-flight.
  const keyRef = useRef(key);
  keyRef.current = key;

  const fetchPage = useCallback(
    async (p: number, replace: boolean) => {
      const activeKey = keyRef.current;
      try {
        const data = await menuService.list({
          page: p,
          perPage,
          search: search || undefined,
          categoryId: categoryId && categoryId !== "all" ? categoryId : undefined,
        });
        if (keyRef.current !== activeKey) return; // stale response — ignore
        setItems((prev) => (replace ? data.items : [...prev, ...data.items]));
        setTotalPages(data.meta.totalPages);
        setPage(p);
        setError(null);
      } catch (err) {
        if (keyRef.current !== activeKey) return;
        setError(err instanceof ApiError ? err.message : "Failed to load menu items");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, perPage],
  );

  // Reset + load the first page whenever the filter key changes (debounced for search).
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      void fetchPage(1, true).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [fetchPage]);

  const hasMore = page < totalPages;

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    void fetchPage(page + 1, false).finally(() => setLoadingMore(false));
  }, [loading, loadingMore, hasMore, page, fetchPage]);

  return { items, loading, loadingMore, error, hasMore, loadMore };
}
