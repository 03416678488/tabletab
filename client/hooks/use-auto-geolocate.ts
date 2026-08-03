"use client";

import { useEffect } from "react";

import { useLocationStore } from "@/hooks/use-location-store";

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

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoStatus("unsupported");
      return;
    }

    let cancelled = false;

    const locate = () => {
      setGeoStatus("locating");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGeoStatus("granted");
        },
        () => {
          if (!cancelled) setGeoStatus("denied");
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
      );
    };

    // Prefer the Permissions API so we stay silent when already granted and
    // never pop a prompt for an already-denied permission.
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status) => {
          if (cancelled) return;
          if (status.state === "denied") setGeoStatus("denied");
          else locate();
        })
        .catch(() => {
          if (!cancelled) locate();
        });
    } else {
      locate();
    }

    return () => {
      cancelled = true;
    };
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
