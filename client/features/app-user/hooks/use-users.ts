"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { appUserService } from "@/features/app-user/services/app-user.service";
import type { AppUser } from "@/features/app-user/types/app-user.types";

export function useUsers(role?: string) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await appUserService.list({ role }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { users, loading, error, refetch };
}
