"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { tableService } from "@/features/table/services/table.service";
import { useTablesStream } from "@/features/table/hooks/use-tables-stream";
import type { DiningTable } from "@/features/table/types/table.types";

export function useTables() {
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tableService.list({ perPage: 100 });
      setTables(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load tables");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // Live floor updates — another device adding/renaming a table reflects here.
  const { connected } = useTablesStream(refetch);

  return { tables, loading, error, refetch, connected };
}
