"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns `false` during SSR and the first client render, then `true`.
 *
 * Use this to gate UI that depends on client-only/persisted state (e.g. the
 * cart badge from a zustand-persisted store) so the first client render matches
 * the server HTML and React doesn't throw a hydration mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
