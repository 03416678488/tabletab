"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { transactionService } from "@/features/transaction/services/transaction.service";
import type {
  PaymentMethod,
  Transaction,
  TransactionType,
} from "@/features/transaction/types/transaction.types";

interface Params {
  type?: TransactionType;
  method?: PaymentMethod;
  branchId?: string;
  initialPerPage?: number;
}

/** Server-paginated transactions (type/method/branch filters). */
export function usePaginatedTransactions({
  type,
  method,
  branchId,
  initialPerPage = 15,
}: Params = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = `${type ?? ""}|${method ?? ""}|${branchId ?? ""}|${perPage}`;
  const keyRef = useRef(key);
  keyRef.current = key;

  const fetchPage = useCallback(
    async (p: number) => {
      const activeKey = keyRef.current;
      setLoading(true);
      setError(null);
      try {
        const data = await transactionService.list({
          page: p,
          perPage,
          ...(type ? { type } : {}),
          ...(method ? { method } : {}),
          ...(branchId ? { branchId } : {}),
        });
        if (keyRef.current !== activeKey) return;
        setTransactions(data.items);
        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.totalItems);
        setPage(p);
      } catch (err) {
        if (keyRef.current !== activeKey) return;
        setError(err instanceof ApiError ? err.message : "Failed to load transactions");
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
    transactions,
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
