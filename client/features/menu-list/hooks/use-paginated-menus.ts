"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { menusService } from "@/features/menu-list/services/menu.service";
import type { Menu } from "@/features/menu-list/types/menu.types";

interface Params {
  search?: string;
  isActive?: boolean;
}

/** Server-paginated menus for the management table. Debounces filter changes. */
export function usePaginatedMenus({ search, isActive }: Params = {}) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ignore out-of-order responses when filters change mid-flight.
  const key = `${search ?? ""}|${isActive ?? ""}|${perPage}`;
  const keyRef = useRef(key);
  keyRef.current = key;

  const fetchPage = useCallback(
    async (p: number) => {
      const activeKey = keyRef.current;
      setLoading(true);
      setError(null);
      try {
        const data = await menusService.list({
          page: p,
          perPage,
          search: search || undefined,
          isActive,
        });
        if (keyRef.current !== activeKey) return;
        setMenus(data.items);
        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.totalItems);
        setPage(p);
      } catch (err) {
        if (keyRef.current !== activeKey) return;
        setError(err instanceof ApiError ? err.message : "Failed to load menus");
      } finally {
        if (keyRef.current === activeKey) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  // Reset to page 1 whenever the filters change (debounced for search typing).
  useEffect(() => {
    const t = setTimeout(() => void fetchPage(1), 250);
    return () => clearTimeout(t);
  }, [fetchPage]);

  const goToPage = useCallback((p: number) => void fetchPage(p), [fetchPage]);
  const refetch = useCallback(() => void fetchPage(page), [fetchPage, page]);

  return { menus, loading, error, page, perPage, setPerPage, totalPages, totalItems, goToPage, refetch };
}
