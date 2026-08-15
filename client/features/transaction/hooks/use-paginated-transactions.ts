"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { transactionService } from "@/features/transaction/services/transaction.service";
import type {
  PaymentMethod,
  Transaction,
  TransactionSummary,
  TransactionType,
} from "@/features/transaction/types/transaction.types";

interface Params {
  type?: TransactionType;
  method?: PaymentMethod;
  branchId?: string;
  minAmount?: number;
  maxAmount?: number;
  from?: string;
  to?: string;
  initialPerPage?: number;
}

/** Server-paginated transactions plus a filter-aware summary (type/method/branch/amount/date). */
export function usePaginatedTransactions({
  type,
  method,
  branchId,
  minAmount,
  maxAmount,
  from,
  to,
  initialPerPage = 15,
}: Params = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = {
    ...(type ? { type } : {}),
    ...(method ? { method } : {}),
    ...(branchId ? { branchId } : {}),
    ...(minAmount != null ? { minAmount } : {}),
    ...(maxAmount != null ? { maxAmount } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
  const key = `${type ?? ""}|${method ?? ""}|${branchId ?? ""}|${minAmount ?? ""}|${maxAmount ?? ""}|${from ?? ""}|${to ?? ""}|${perPage}`;
  const keyRef = useRef(key);
  keyRef.current = key;

  const fetchPage = useCallback(
    async (p: number) => {
      const activeKey = keyRef.current;
      setLoading(true);
      setError(null);
      try {
        const [data, summ] = await Promise.all([
          transactionService.list({ page: p, perPage, ...filters }),
          transactionService.summary(filters),
        ]);
        if (keyRef.current !== activeKey) return;
        setTransactions(data.items);
        setSummary(summ);
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
    summary,
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
