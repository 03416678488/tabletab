"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { taxGroupService, type TaxGroup } from "@/features/tax/services/tax-group.service";

export function useTaxGroups(branchId?: string) {
  const [groups, setGroups] = useState<TaxGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGroups(await taxGroupService.list(branchId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load tax groups");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { groups, loading, error, refetch };
}
