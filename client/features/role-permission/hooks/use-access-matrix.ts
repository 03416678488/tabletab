"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { rolePermissionService } from "@/features/role-permission/services/role-permission.service";
import type { AccessMatrix } from "@/features/role-permission/types/role-permission.types";

export function useAccessMatrix() {
  const [matrix, setMatrix] = useState<AccessMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMatrix(await rolePermissionService.matrix());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { matrix, loading, error, refetch };
}
