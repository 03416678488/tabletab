"use client";

import { useEffect, useRef, useState } from "react";
import { getSession } from "next-auth/react";

import { openEventStream } from "@/lib/event-stream";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

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
    return openEventStream(`${BASE}/reservations/stream`, {
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
