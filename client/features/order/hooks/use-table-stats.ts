"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { orderService } from "@/features/order/services/order.service";
import { useTablesStream } from "@/features/table/hooks/use-tables-stream";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import type { TableStat } from "@/features/order/types/order.types";

/** Live per-table order aggregation, keyed by tableId for easy lookup. */
export function useTableStats() {
  const [stats, setStats] = useState<TableStat[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi-branch roles follow the topbar switcher; staff use their home branch.
  const branchId = useScopedBranchId();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await orderService.tableStats(branchId));
    } catch {
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // Occupancy shifts live as orders open/close tables (order → tables channel).
  useTablesStream(refetch);

  const byTable = useMemo(() => {
    const map = new Map<string, TableStat>();
    for (const s of stats) map.set(s.tableId, s);
    return map;
  }, [stats]);

  return { byTable, loading, refetch };
}
