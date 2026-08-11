"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { purchasingService } from "@/features/purchasing/services/purchasing.service";
import type {
  PurchaseOrder,
  PurchaseOrderStatus,
} from "@/features/purchasing/types/purchasing.types";

interface Params {
  search?: string;
  branchId?: string;
  status?: PurchaseOrderStatus;
  initialPerPage?: number;
}

export function usePaginatedPurchaseOrders({
  search,
  branchId,
  status,
  initialPerPage = 15,
}: Params = {}) {
  const [items, setItems] = useState<PurchaseOrder[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = `${search ?? ""}|${branchId ?? ""}|${status ?? ""}|${perPage}`;
  const keyRef = useRef(key);
  keyRef.current = key;

  const fetchPage = useCallback(
    async (p: number) => {
      const activeKey = keyRef.current;
      setLoading(true);
      setError(null);
      try {
        const data = await purchasingService.listPurchaseOrders({
          page: p,
          perPage,
          ...(search ? { search } : {}),
          ...(branchId ? { branchId } : {}),
          ...(status ? { status } : {}),
        });
        if (keyRef.current !== activeKey) return;
        setItems(data.items);
        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.totalItems);
        setPage(p);
      } catch (err) {
        if (keyRef.current !== activeKey) return;
        setError(err instanceof ApiError ? err.message : "Failed to load purchase orders");
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
    items,
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
