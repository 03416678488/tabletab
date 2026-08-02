"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { orderService } from "@/features/order/services/order.service";
import type { Order } from "@/features/order/types/order.types";

/**
 * Live kitchen/pickup board. Polls `/orders/board` on an interval so the screen
 * stays current without a manual refresh.
 */
export function useOrderBoard(pollMs = 8000) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  // Track first load so polling refreshes don't flash the skeleton.
  const initial = useRef(true);

  const refetch = useCallback(async () => {
    try {
      const data = await orderService.board();
      setOrders(data);
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load board");
    } finally {
      if (initial.current) {
        initial.current = false;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refetch();
    const id = setInterval(() => void refetch(), pollMs);
    return () => clearInterval(id);
  }, [refetch, pollMs]);

  return { orders, loading, error, lastUpdated, refetch };
}
