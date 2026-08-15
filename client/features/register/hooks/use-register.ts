"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { registerService } from "@/features/register/services/register.service";
import type {
  CurrentRegister,
  RegisterOverview,
  RegisterSession,
} from "@/features/register/types/register.types";

/** A single branch's drawer (operate view). Scoped to `branchId`. */
export function useRegister(branchId?: string) {
  const [current, setCurrent] = useState<CurrentRegister>({ session: null, summary: null });
  const [sessions, setSessions] = useState<RegisterSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cur, sess] = await Promise.all([
        registerService.current(branchId),
        registerService.sessions(branchId),
      ]);
      setCurrent(cur);
      setSessions(sess);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load register");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { current, sessions, loading, error, refetch };
}

/** Cross-branch drawer snapshot for the "All branches" view (read-only). */
export function useRegisterOverview() {
  const [overview, setOverview] = useState<RegisterOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOverview(await registerService.overview());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load register overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { overview, loading, error, refetch };
}
