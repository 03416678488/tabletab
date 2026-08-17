"use client";

import { useEffect } from "react";

import { httpClient } from "@/lib/httpClient";
import type { Analytics } from "@/features/analytics/types/analytics.types";

/**
 * Injects the admin's active analytics/tracking snippets (Settings → Analytics)
 * into the storefront so they actually run. The stored `code` is a trusted
 * admin-authored snippet (e.g. a Google Analytics / Pixel <script>); we use
 * `createContextualFragment` because it executes <script> tags — assigning
 * innerHTML would insert them inert. Runs once per full page load; skipped for
 * client-side navigations so trackers aren't double-loaded.
 */
export function AnalyticsScripts() {
  useEffect(() => {
    let cancelled = false;
    httpClient
      .get<Analytics[]>("/analytics")
      .then((res) => {
        if (cancelled) return;
        const active = res.data.filter((a) => a.isActive && a.code?.trim());
        for (const a of active) {
          const frag = document.createRange().createContextualFragment(a.code as string);
          document.head.appendChild(frag);
        }
      })
      .catch(() => {
        // Analytics is best-effort — never break the page over a tracking snippet.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
