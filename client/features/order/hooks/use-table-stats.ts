"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { orderService } from "@/features/order/services/order.service";
import type { TableStat } from "@/features/order/types/order.types";

/** Live per-table order aggregation, keyed by tableId for easy lookup. */
export function useTableStats() {
  const [stats, setStats] = useState<TableStat[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await orderService.tableStats());
    } catch {
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const byTable = useMemo(() => {
    const map = new Map<string, TableStat>();
    for (const s of stats) map.set(s.tableId, s);
    return map;
  }, [stats]);

  return { byTable, loading, refetch };
}
