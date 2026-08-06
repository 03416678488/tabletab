"use client";

import { useEffect } from "react";

/**
 * Registers the offline app-shell service worker. Production only — in dev the
 * SW would cache Next's un-hashed chunks and fight HMR, so it's disabled there.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // registration failure is non-fatal — the app just won't be offline-capable
    });
  }, []);

  return null;
}
