"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { reportService } from "@/features/report/services/report.service";
import type { SalesReport } from "@/features/report/types/report.types";

export function useSalesReport(
  from?: string,
  to?: string,
  branchId?: string,
  granularity?: string,
) {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await reportService.sales(from, to, branchId, granularity));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [from, to, branchId, granularity]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { report, loading, error, refetch };
}
