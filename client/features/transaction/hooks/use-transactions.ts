"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { transactionService } from "@/features/transaction/services/transaction.service";
import type {
  ListTransactionsParams,
  Transaction,
} from "@/features/transaction/types/transaction.types";

export function useTransactions(params?: ListTransactionsParams) {
  const key = JSON.stringify(params ?? {});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await transactionService.list({ perPage: 100, ...(params ?? {}) });
      setTransactions(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { transactions, loading, error, refetch };
}
