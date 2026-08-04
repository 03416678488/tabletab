"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { registerService } from "@/features/register/services/register.service";
import type {
  CurrentRegister,
  RegisterSession,
} from "@/features/register/types/register.types";

export function useRegister() {
  const [current, setCurrent] = useState<CurrentRegister>({ session: null, summary: null });
  const [sessions, setSessions] = useState<RegisterSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cur, sess] = await Promise.all([
        registerService.current(),
        registerService.sessions(),
      ]);
      setCurrent(cur);
      setSessions(sess);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load register");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { current, sessions, loading, error, refetch };
}
