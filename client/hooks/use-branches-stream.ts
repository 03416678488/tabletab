"use client";

import { useEffect, useRef } from "react";

import { resolveApiBaseUrl } from "@/lib/api-base";

const BASE = resolveApiBaseUrl();

/**
 * Subscribe to live branch changes (open/closed, online ordering, delivery /
 * pickup flags, fees) over SSE (`GET /branches/stream`). Public — branches aren't
 * sensitive — so native `EventSource` works. On `branch.changed` the caller
 * refetches so the storefront's fulfillment options reconcile in real time.
 */
export function useBranchesStream(onChange: () => void, enabled = true): void {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const es = new EventSource(`${BASE}/branches/stream`);
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
