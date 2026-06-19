"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Order, ServiceRequest } from "@/lib/types";

interface UseLiveOpsOptions {
  branchId: string;
  /** Poll interval for orders + requests (ms). */
  pollMs?: number;
  /** Inject demo orders periodically. */
  simulateOrders?: boolean;
  /** Inject demo service requests periodically. */
  simulateRequests?: boolean;
}

export function useLiveOps({
  branchId,
  pollMs = 3000,
  simulateOrders = false,
  simulateRequests = false,
}: UseLiveOpsOptions) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [o, r] = await Promise.all([
        api.getOrders(branchId),
        api.getServiceRequests(branchId),
      ]);
      setOrders(o);
      setRequests(r);
      setError(null);
    } catch {
      setError("Failed to refresh");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, pollMs);
    return () => clearInterval(poll);
  }, [refresh, pollMs]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!simulateOrders) return;
    const sim = setInterval(() => {
      void api.simulateIncomingOrder(branchId).then(() => refresh());
    }, 28000);
    return () => clearInterval(sim);
  }, [branchId, simulateOrders, refresh]);

  useEffect(() => {
    if (!simulateRequests) return;
    const sim = setInterval(() => {
      void api.simulateServiceRequest(branchId, "waiter").then(() => refresh());
    }, 35000);
    return () => clearInterval(sim);
  }, [branchId, simulateRequests, refresh]);

  return { orders, requests, loading, error, refresh, tick };
}
