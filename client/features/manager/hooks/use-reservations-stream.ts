"use client";

import { useEffect, useRef, useState } from "react";
import { getSession } from "next-auth/react";

import { openEventStream } from "@/lib/event-stream";
import { resolveApiBaseUrl } from "@/lib/api-base";

/**
 * Subscribe to the tenant's live reservation book (`GET /reservations/stream`).
 * Staff-authenticated (bearer token from the NextAuth session). Events say "the
 * book changed"; the caller reconciles by refetching.
 */
export function useReservationsStream(
  onChange: () => void,
  enabled = true,
): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    return openEventStream(`${resolveApiBaseUrl()}/reservations/stream`, {
      getToken: async () => (await getSession())?.accessToken,
      onOpen: () => setConnected(true),
      onError: () => setConnected(false),
      onEvent: (d) => {
        if (d.event !== "ping") cbRef.current();
      },
    });
  }, [enabled]);

  return { connected };
}
