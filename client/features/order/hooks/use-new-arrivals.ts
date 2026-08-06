"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Flags ids that have newly appeared since the first settled load, so the UI can
 * blink them for attention (e.g. new tickets on the KDS / OSS boards).
 *
 * Ids present on the first load (once `ready`) are seeded as already-seen so the
 * initial render doesn't blink everything. Each flag auto-clears after
 * `durationMs`.
 */
export function useNewArrivals(
  ids: string[],
  {
    ready,
    durationMs = 15000,
    onArrive,
  }: { ready: boolean; durationMs?: number; onArrive?: (freshIds: string[]) => void },
): Set<string> {
  const seen = useRef<Set<string>>(new Set());
  const seeded = useRef(false);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  // Keep the callback in a ref so it isn't an effect dependency.
  const onArriveRef = useRef(onArrive);
  onArriveRef.current = onArrive;

  useEffect(() => {
    if (!ready) return;

    // First settled load: remember what's already here without blinking it.
    if (!seeded.current) {
      ids.forEach((id) => seen.current.add(id));
      seeded.current = true;
      return;
    }

    const fresh = ids.filter((id) => !seen.current.has(id));
    if (fresh.length === 0) return;

    fresh.forEach((id) => seen.current.add(id));
    onArriveRef.current?.(fresh);
    setFlagged((prev) => {
      const next = new Set(prev);
      fresh.forEach((id) => next.add(id));
      return next;
    });

    for (const id of fresh) {
      const timer = setTimeout(() => {
        setFlagged((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        timers.current.delete(id);
      }, durationMs);
      timers.current.set(id, timer);
    }
  }, [ids, ready, durationMs]);

  // Clear any pending timers on unmount.
  useEffect(() => {
    const timers_ = timers.current;
    return () => timers_.forEach((t) => clearTimeout(t));
  }, []);

  return flagged;
}
