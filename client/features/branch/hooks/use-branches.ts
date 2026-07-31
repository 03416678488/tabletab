"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { branchService } from "@/features/branch/services/branch.service";
import type { Branch } from "@/features/branch/types/branch.types";

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await branchService.list({ perPage: 100 });
      setBranches(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { branches, loading, error, refetch };
}
