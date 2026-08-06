"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { tableService } from "@/features/table/services/table.service";
import type { DiningTable } from "@/features/table/types/table.types";

interface Params {
  search?: string;
  branchId?: string;
  isActive?: boolean;
  initialPerPage?: number;
}

/** Server-paginated tables (multi-column search + branch/status filters). */
export function usePaginatedTables({
  search,
  branchId,
  isActive,
  initialPerPage = 15,
}: Params = {}) {
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = `${search ?? ""}|${branchId ?? ""}|${isActive ?? ""}|${perPage}`;
  const keyRef = useRef(key);
  keyRef.current = key;

  const fetchPage = useCallback(
    async (p: number) => {
      const activeKey = keyRef.current;
      setLoading(true);
      setError(null);
      try {
        const data = await tableService.list({
          page: p,
          perPage,
          search: search || undefined,
          branchId: branchId && branchId !== "all" ? branchId : undefined,
          isActive,
        });
        if (keyRef.current !== activeKey) return;
        setTables(data.items);
        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.totalItems);
        setPage(p);
      } catch (err) {
        if (keyRef.current !== activeKey) return;
        setError(err instanceof ApiError ? err.message : "Failed to load tables");
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

  return {
    tables,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  };
}
