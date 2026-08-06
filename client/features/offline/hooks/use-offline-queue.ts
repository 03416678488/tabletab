"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { orderService } from "@/features/order/services/order.service";
import type { CreateOrderInput } from "@/features/order/types/order.types";
import {
  OFFLINE_QUEUE_EVENT,
  enqueueOrder,
  getQueue,
  markQueueItemFailed,
  removeFromQueue,
  retryQueueItem,
  type QueuedOrder,
} from "@/features/offline/lib/offline-store";
import { useOnlineStatus } from "@/features/offline/hooks/use-online-status";

/**
 * The offline order queue: enqueue orders taken offline, and replay them to the
 * API on reconnect. A 4xx on replay (e.g. an item no longer exists) flags that
 * order as failed for the cashier to review; a network error just retries later.
 */
export function useOfflineQueue() {
  const online = useOnlineStatus();
  const [queue, setQueue] = useState<QueuedOrder[]>([]);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  useEffect(() => {
    const refresh = () => setQueue(getQueue());
    refresh();
    window.addEventListener(OFFLINE_QUEUE_EVENT, refresh);
    return () => window.removeEventListener(OFFLINE_QUEUE_EVENT, refresh);
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    const pending = getQueue().filter((o) => o.status === "pending");
    if (pending.length === 0) return;

    syncingRef.current = true;
    setSyncing(true);
    try {
      for (const q of pending) {
        try {
          await orderService.create(q.payload);
          removeFromQueue(q.localId);
        } catch (err) {
          const code = err instanceof ApiError ? err.statusCode : undefined;
          if (code && code >= 400 && code < 500) {
            // The server rejected it — keep it flagged for review, keep going.
            markQueueItemFailed(q.localId, err instanceof Error ? err.message : "Rejected on sync");
          } else {
            break; // network error / still offline — stop and retry later
          }
        }
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, []);

  // Replay automatically whenever connectivity returns.
  useEffect(() => {
    if (online) void syncNow();
  }, [online, syncNow]);

  const enqueue = useCallback((payload: CreateOrderInput) => enqueueOrder(payload), []);

  const discard = useCallback((localId: string) => removeFromQueue(localId), []);

  const retry = useCallback(
    (localId: string) => {
      retryQueueItem(localId);
      void syncNow();
    },
    [syncNow],
  );

  return {
    online,
    queue,
    pending: queue.filter((o) => o.status === "pending").length,
    failed: queue.filter((o) => o.status === "failed").length,
    syncing,
    enqueue,
    syncNow,
    retry,
    discard,
  };
}
