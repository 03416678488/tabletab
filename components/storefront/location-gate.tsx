"use client";

import { useEffect, useState } from "react";
import { LocateFixed, MapPin, Navigation } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocationStore } from "@/hooks/use-location-store";
import { api } from "@/lib/api";
import { branchDistanceKm, nearestBranch } from "@/lib/geo";
import type { Branch } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Shown on the landing when no branch is selected yet. Asks for location
 * access to auto-pick the nearest branch, with a manual picker fallback.
 */
export function LocationGate() {
  const coords = useLocationStore((s) => s.coords);
  const geoStatus = useLocationStore((s) => s.geoStatus);
  const setBranch = useLocationStore((s) => s.setBranch);
  const setCoords = useLocationStore((s) => s.setCoords);
  const setGeoStatus = useLocationStore((s) => s.setGeoStatus);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getBranches()
      .then((list) => {
        if (!cancelled) setBranches(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const locate = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoStatus("unsupported");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setGeoStatus("granted");
        const nearest = nearestBranch(branches, c);
        if (nearest) setBranch(nearest.id);
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const locating = geoStatus === "locating";
  const showError = geoStatus === "denied" || geoStatus === "unsupported";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-tint text-brand">
          <Navigation className="size-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold text-ink">Find food near you</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          Share your location and we&apos;ll show the menu from your nearest branch — with live
          delivery times.
        </p>
      </div>

      <button
        type="button"
        onClick={locate}
        disabled={locating}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-colors hover:bg-brand-hover disabled:opacity-70"
      >
        <LocateFixed className={cn("size-5", locating && "animate-pulse")} />
        {locating ? "Locating…" : "Use my current location"}
      </button>

      {showError && (
        <p className="mt-3 rounded-xl bg-accent-tint px-4 py-2.5 text-center text-sm text-amber-700">
          {geoStatus === "unsupported"
            ? "Location isn't available on this device — pick a branch below."
            : "We couldn't access your location — pick a branch below."}
        </p>
      )}

      <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or choose a branch
        <span className="h-px flex-1 bg-border" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {branches.map((branch) => {
            const km = branchDistanceKm(branch, coords);
            return (
              <li key={branch.id}>
                <button
                  type="button"
                  onClick={() => setBranch(branch.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-brand/40 hover:bg-brand-tint/40"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
                    <MapPin className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold text-ink">{branch.name}</span>
                      <span
                        className={cn(
                          "shrink-0 text-xs font-medium",
                          branch.isOpen ? "text-emerald-600" : "text-muted-foreground",
                        )}
                      >
                        {branch.isOpen ? "Open" : "Closed"}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                      {branch.address}, {branch.city}
                    </span>
                  </span>
                  {km != null && (
                    <span className="shrink-0 text-sm font-semibold text-brand">
                      {km < 10 ? km.toFixed(1) : Math.round(km)} km
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
