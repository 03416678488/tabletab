"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { categoryService } from "@/features/category/services/category.service";
import type { Category } from "@/features/category/types/category.types";

const PER_PAGE = 10;

interface Params {
  search?: string;
  isActive?: boolean;
}

/** Server-paginated categories for the management table. Debounces filter changes. */
export function usePaginatedCategories({ search, isActive }: Params = {}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = `${search ?? ""}|${isActive ?? ""}`;
  const keyRef = useRef(key);
  keyRef.current = key;

  const fetchPage = useCallback(
    async (p: number) => {
      const activeKey = keyRef.current;
      setLoading(true);
      setError(null);
      try {
        const data = await categoryService.list({
          page: p,
          perPage: PER_PAGE,
          search: search || undefined,
          isActive,
        });
        if (keyRef.current !== activeKey) return;
        setCategories(data.items);
        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.totalItems);
        setPage(p);
      } catch (err) {
        if (keyRef.current !== activeKey) return;
        setError(err instanceof ApiError ? err.message : "Failed to load categories");
      } finally {
        if (keyRef.current === activeKey) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  useEffect(() => {
    const t = setTimeout(() => void fetchPage(1), 250);
    return () => clearTimeout(t);
  }, [fetchPage]);

  const goToPage = useCallback((p: number) => void fetchPage(p), [fetchPage]);
  const refetch = useCallback(() => void fetchPage(page), [fetchPage, page]);

  return { categories, loading, error, page, totalPages, totalItems, goToPage, refetch };
}
