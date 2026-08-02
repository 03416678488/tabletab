"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { areaService } from "@/features/area/services/area.service";
import type { Area } from "@/features/area/types/area.types";

export function useAreas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await areaService.list({ perPage: 100 });
      setAreas(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load areas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { areas, loading, error, refetch };
}
