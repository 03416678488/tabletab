"use client";

import { useEffect, useRef, useState } from "react";

import { resolveApiBaseUrl } from "@/lib/api-base";

const BASE = resolveApiBaseUrl();

/**
 * Live status for a guest's reservation confirmation page (`GET
 * /reservations/:id/stream`). Public — the reservation UUID is a capability — so
 * native `EventSource` works. On any `reservation.*` event the caller refetches.
 */
export function useReservationStream(
  reservationId: string | null,
  onUpdate: () => void,
  enabled = true,
): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate;

  useEffect(() => {
    if (!reservationId || !enabled || typeof window === "undefined") return;
    const es = new EventSource(`${BASE}/reservations/${reservationId}/stream`);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (evt) => {
      try {
        const d = JSON.parse(evt.data) as { event?: string };
        if (d.event && d.event !== "ping") cbRef.current();
      } catch {
        /* ignore malformed frames */
      }
    };
    return () => es.close();
  }, [reservationId, enabled]);

  return { connected };
}
