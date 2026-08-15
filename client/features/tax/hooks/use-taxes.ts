"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { taxService, type Tax } from "@/features/tax/services/tax.service";

export function useTaxes(branchId?: string) {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTaxes(await taxService.list(branchId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load taxes");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { taxes, loading, error, refetch };
}
