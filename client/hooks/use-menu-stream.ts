"use client";

import { useEffect, useRef } from "react";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * Subscribe to live menu changes (availability / price / add / remove) over SSE
 * (`GET /menu-items/stream`). The endpoint is public — the menu isn't sensitive —
 * so native `EventSource` works (and auto-reconnects). Events just say "the menu
 * changed"; the caller refetches to reconcile.
 */
export function useMenuStream(onChange: () => void, enabled = true): void {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const es = new EventSource(`${BASE}/menu-items/stream`);
    es.onmessage = (evt) => {
      try {
        const d = JSON.parse(evt.data) as { event?: string };
        if (d.event && d.event !== "ping") cbRef.current();
      } catch {
        /* ignore malformed frames */
      }
    };
    return () => es.close();
  }, [enabled]);
}
