"use client";

import { useEffect } from "react";

/**
 * Registers the offline app-shell service worker. Production only — in dev the
 * SW would cache Next's un-hashed chunks and fight HMR, so it's disabled there.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    // In dev, actively tear down any SW left behind by a prior production build
    // (`next start`). A stale SW serves cached prod HTML/chunks that don't match
    // the dev server, which shows up as the page reloading over and over.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) void reg.unregister();
      });
      if (typeof caches !== "undefined") {
        caches.keys().then((keys) => keys.forEach((k) => void caches.delete(k)));
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // registration failure is non-fatal — the app just won't be offline-capable
    });
  }, []);

  return null;
}
