"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSession } from "next-auth/react";

import { openEventStream } from "@/lib/event-stream";
import { resolveApiBaseUrl } from "@/lib/api-base";
import { serviceRequestService } from "@/features/service-request/services/service-request.service";
import type { ServiceRequest } from "@/lib/types";

/**
 * Live open service-request queue (guests calling a waiter / ready to pay).
 * Realtime via SSE (`/service-requests/stream`): a new or resolved request pushes
 * an event and we refetch the open list.
 */
export function useServiceRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setRequests(await serviceRequestService.listOpen());
    } catch {
      /* keep the last known list on a transient failure */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // Live: reconcile on any queue change.
  const cbRef = useRef(refetch);
  cbRef.current = refetch;
  useEffect(() => {
    if (typeof window === "undefined") return;
    return openEventStream(`${resolveApiBaseUrl()}/service-requests/stream`, {
      getToken: async () => (await getSession())?.accessToken,
      onEvent: (d) => {
        if (d.event !== "ping") cbRef.current();
      },
    });
  }, []);

  const resolve = useCallback(
    async (id: string) => {
      setRequests((prev) => prev.filter((r) => r.id !== id)); // optimistic
      try {
        await serviceRequestService.resolve(id);
      } catch {
        void refetch(); // restore on failure
      }
    },
    [refetch],
  );

  return { requests, loading, resolve, refetch };
}
