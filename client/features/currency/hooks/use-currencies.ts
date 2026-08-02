"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { currencyService } from "@/features/currency/services/currency.service";
import type { Currency } from "@/features/currency/types/currency.types";

export function useCurrencies() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCurrencies(await currencyService.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load currencies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { currencies, loading, error, refetch };
}
