"use client";

import { useEffect, useRef, useState } from "react";
import { mapOrderStatus } from "@/features/storefront/services/storefront-orders";
import type { OrderStatus } from "@/lib/types";
import { resolveApiBaseUrl } from "@/lib/api-base";

const BASE = resolveApiBaseUrl();

export interface OrderStreamUpdate {
  status: OrderStatus;
  updatedAt: string;
}

/**
 * Subscribe to live order-status updates over SSE (`GET /orders/:id/stream`).
 * The browser's EventSource auto-reconnects on drops; callers should still do an
 * initial REST fetch to reconcile, treating the stream as deltas on top.
 *
 * The order UUID is a capability (public endpoint), so no auth header is sent —
 * which also suits EventSource, since it can't set custom headers.
 */
export function useOrderStream(
  orderId: string | null,
  onUpdate: (u: OrderStreamUpdate) => void,
  enabled = true,
): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate;

  useEffect(() => {
    if (!orderId || !enabled || typeof window === "undefined") return;

    const es = new EventSource(`${BASE}/orders/${orderId}/stream`);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false); // EventSource retries automatically
    es.onmessage = (evt) => {
      try {
        const d = JSON.parse(evt.data) as {
          event?: string;
          status?: string;
          updatedAt?: string;
        };
        if (d.event === "ping" || !d.status) return;
        cbRef.current({
          status: mapOrderStatus(d.status),
          updatedAt: d.updatedAt ?? new Date().toISOString(),
        });
      } catch {
        /* ignore malformed frames */
      }
    };

    return () => es.close();
  }, [orderId, enabled]);

  return { connected };
}
