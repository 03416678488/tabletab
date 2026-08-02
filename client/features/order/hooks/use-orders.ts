"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { orderService } from "@/features/order/services/order.service";
import type { ListOrdersParams, Order } from "@/features/order/types/order.types";

/** List orders, optionally scoped by type/status. Params are read once per key. */
export function useOrders(params?: ListOrdersParams) {
  const key = JSON.stringify(params ?? {});
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.list({ perPage: 100, ...(params ?? {}) });
      setOrders(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { orders, loading, error, refetch };
}
