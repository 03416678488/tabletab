"use client";

import { useEffect } from "react";

import { useLocationStore } from "@/hooks/use-location-store";
import { geolocationBlockedReason, getCurrentPosition } from "@/lib/geolocation";

/**
 * Auto-detect the visitor's location on mount so the landing can pick their
 * nearest branch without a manual step.
 *
 * - Skips if we already have coordinates (persisted) or the user manually chose
 *   a branch — so we never re-prompt an existing visitor.
 * - Uses the Permissions API when available: a previously granted permission
 *   resolves silently; a denied one is respected (no prompt); otherwise the
 *   native prompt is shown once.
 */
export function useAutoGeolocate() {
  const setCoords = useLocationStore((s) => s.setCoords);
  const setGeoStatus = useLocationStore((s) => s.setGeoStatus);

  useEffect(() => {
    const { coords, branchId } = useLocationStore.getState();
    if (coords || branchId) return; // already located / chosen

    // No geolocation at all (old browser) → give up silently. An insecure origin
    // (non-HTTPS) still falls through to locate(), which fails to "denied" — the
    // LocationGate turns that into the HTTPS hint.
    if (geolocationBlockedReason() === "unsupported") {
      setGeoStatus("unsupported");
      return;
    }

    let cancelled = false;

    const locate = () => {
      setGeoStatus("locating");
      getCurrentPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 })
        .then((c) => {
          if (cancelled) return;
          setCoords(c);
          setGeoStatus("granted");
        })
        .catch(() => {
          if (!cancelled) setGeoStatus("denied");
        });
    };

    // Prefer the Permissions API: silently resolve only when the user has
    // ALREADY granted access. When it's undecided ("prompt") we do NOT fire the
    // native prompt cold — we flag `prompt` so the home page can show our
    // explaining pre-prompt dialog first, which then triggers the native prompt
    // on the user's click. A denied permission is respected (no prompt).
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status) => {
          if (cancelled) return;
          if (status.state === "granted") locate();
          else if (status.state === "denied") setGeoStatus("denied");
          else setGeoStatus("prompt");
        })
        .catch(() => {
          if (!cancelled) setGeoStatus("prompt");
        });
    } else {
      // No Permissions API — ask via our dialog rather than a cold native prompt.
      setGeoStatus("prompt");
    }

    return () => {
      cancelled = true;
    };
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
