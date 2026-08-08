"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { orderService } from "@/features/order/services/order.service";
import { useActiveBranch, isAllBranches } from "@/features/branch/hooks/use-active-branch";
import type {
  Order,
  OrderStatus,
  OrderType,
  PaymentStatus,
} from "@/features/order/types/order.types";

interface Params {
  orderType?: OrderType;
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  initialPerPage?: number;
  /** Ignore the topbar branch filter (e.g. a notification deep-link to a
   *  specific order must be found regardless of which branch is selected). */
  crossBranch?: boolean;
}

/** Server-paginated orders (multi-column search + type/status/payment filters). */
export function usePaginatedOrders({
  orderType,
  search,
  status,
  paymentStatus,
  initialPerPage = 15,
  crossBranch = false,
}: Params = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scope to the topbar branch selection ("All branches" → undefined = all).
  // `crossBranch` overrides it so a deep-linked order is never hidden by the
  // currently selected branch.
  const activeBranchId = useActiveBranch((s) => s.activeBranchId);
  const branchId =
    crossBranch || !activeBranchId || isAllBranches(activeBranchId) ? undefined : activeBranchId;

  const key = `${orderType ?? ""}|${search ?? ""}|${status ?? ""}|${paymentStatus ?? ""}|${branchId ?? ""}|${perPage}`;
  const keyRef = useRef(key);
  keyRef.current = key;

  const fetchPage = useCallback(
    async (p: number) => {
      const activeKey = keyRef.current;
      setLoading(true);
      setError(null);
      try {
        const data = await orderService.list({
          page: p,
          perPage,
          orderType,
          status,
          paymentStatus,
          search: search || undefined,
          branchId,
        });
        if (keyRef.current !== activeKey) return;
        setOrders(data.items);
        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.totalItems);
        setPage(p);
      } catch (err) {
        if (keyRef.current !== activeKey) return;
        setError(err instanceof ApiError ? err.message : "Failed to load orders");
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
    orders,
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
