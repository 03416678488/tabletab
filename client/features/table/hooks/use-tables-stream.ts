"use client";

import { useEffect, useRef, useState } from "react";
import { getSession } from "next-auth/react";

import { openEventStream } from "@/lib/event-stream";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * Subscribe to the tenant's live floor stream (`GET /tables/stream`): table CRUD
 * and order-driven occupancy changes. Staff-authenticated — the bearer token
 * comes from the NextAuth session (EventSource can't set headers). Events only
 * say "tables changed"; the caller reconciles by refetching.
 */
export function useTablesStream(onChange: () => void, enabled = true): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    return openEventStream(`${BASE}/tables/stream`, {
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
