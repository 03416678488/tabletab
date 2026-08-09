"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { orderService } from "@/features/order/services/order.service";
import { useBoardStream } from "@/features/order/hooks/use-board-stream";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import type { Order } from "@/features/order/types/order.types";

/**
 * Live kitchen/pickup board. Realtime via SSE (`/orders/board/stream`): new
 * orders and status changes push a "board changed" event and we refetch. A slow
 * poll stays as a safety net for anything missed during a reconnect.
 */
export function useOrderBoard(pollMs = 30000) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  // Track first load so refreshes don't flash the skeleton.
  const initial = useRef(true);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Multi-branch roles follow the topbar switcher; single-branch staff are scoped
  // to their assigned home branch (see useScopedBranchId).
  const branchId = useScopedBranchId();

  const refetch = useCallback(async () => {
    try {
      const data = await orderService.board(branchId);
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
  }, [branchId]);

  // Coalesce bursts (e.g. several line items placed at once) into one refetch.
  const scheduleRefetch = useCallback(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void refetch(), 250);
  }, [refetch]);

  const { connected } = useBoardStream(scheduleRefetch);

  useEffect(() => {
    void refetch();
    const id = setInterval(() => void refetch(), pollMs);
    return () => {
      clearInterval(id);
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [refetch, pollMs]);

  return { orders, loading, error, lastUpdated, refetch, connected };
}
