"use client";

import { useState } from "react";
import { ChevronLeft, LocateFixed, MapPin, Navigation } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLocationStore } from "@/hooks/use-location-store";
import { branchDistanceKm, nearestBranch } from "@/lib/geo";
import { getCurrentPosition, GEO_HTTPS_HINT } from "@/lib/geolocation";
import { cn } from "@/lib/utils";
import { useStorefrontBranches } from "@/features/storefront/hooks/use-storefront-branches";

interface LocationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Pre-prompt for the storefront landing. Two steps:
 *  1. "ask"  — allow location → resolve the NEAREST branch, or pick manually.
 *  2. "pick" — choose a specific branch from the list; the landing then shows
 *              everything (menu, delivery, hours) for that branch.
 */
export function LocationPermissionDialog({ open, onOpenChange }: LocationPermissionDialogProps) {
  const setBranch = useLocationStore((s) => s.setBranch);
  const setCoords = useLocationStore((s) => s.setCoords);
  const setConfirmed = useLocationStore((s) => s.setConfirmed);
  const setGeoStatus = useLocationStore((s) => s.setGeoStatus);
  const coords = useLocationStore((s) => s.coords);

  // Cached live branches so the branch we pick matches the ids the landing resolves.
  const { branches } = useStorefrontBranches();
  const [view, setView] = useState<"ask" | "pick">("ask");
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);
  // True when the failure is really the HTTPS/secure-context requirement.
  const [insecure, setInsecure] = useState(false);

  const allow = async () => {
    setLocating(true);
    setDenied(false);
    setInsecure(false);
    try {
      const c = await getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      });
      setCoords(c);
      setGeoStatus("granted");
      const nearest = nearestBranch(branches, c);
      if (nearest) setBranch(nearest.id);
      setConfirmed(true);
      close();
    } catch (err) {
      setDenied(true);
      setGeoStatus("denied");
      if (err instanceof Error && err.message === GEO_HTTPS_HINT) setInsecure(true);
    } finally {
      setLocating(false);
    }
  };

  /** User picked a specific branch → scope the whole storefront to it. */
  const selectBranch = (id: string) => {
    setBranch(id);
    setConfirmed(true);
    close();
  };

  const close = () => {
    setView("ask");
    onOpenChange(false);
  };

  // Dismissing (X / overlay) without a choice still needs a branch so the menu
  // and checkout work — fall back to the nearest open branch.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      if (!useLocationStore.getState().branchId) {
        const fallback = nearestBranch(branches, null);
        if (fallback) setBranch(fallback.id);
      }
      setConfirmed(true);
      setView("ask");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        {view === "ask" ? (
          <div className="text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-tint text-brand">
              <Navigation className="size-7" />
            </div>
            <DialogTitle className="mt-2 text-center text-xl">Find food near you</DialogTitle>
            <DialogDescription className="text-center">
              Share your location and we&apos;ll show your nearest branch with live delivery times —
              or choose a branch yourself.
            </DialogDescription>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void allow()}
                disabled={locating}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-brand-hover disabled:opacity-70"
              >
                <LocateFixed className={cn("size-5", locating && "animate-pulse")} />
                {locating ? "Locating…" : "Allow location"}
              </button>
              <button
                type="button"
                onClick={() => setView("pick")}
                className="w-full rounded-full px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-ink"
              >
                Choose a branch
              </button>
            </div>

            {denied && (
              <p className="mt-1 text-xs text-amber-700">
                {insecure
                  ? `${GEO_HTTPS_HINT} You can still choose a branch.`
                  : "Couldn't access your location. You can still choose a branch."}
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setView("ask")}
                aria-label="Back"
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-ink"
              >
                <ChevronLeft className="size-5" />
              </button>
              <DialogTitle className="text-lg">Choose your branch</DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              Pick a branch to see its menu, delivery, and hours.
            </DialogDescription>

            {branches.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading branches…</p>
            ) : (
              <ul className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto">
                {branches.map((branch) => {
                  const km = branchDistanceKm(branch, coords);
                  return (
                    <li key={branch.id}>
                      <button
                        type="button"
                        onClick={() => selectBranch(branch.id)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 text-left transition-colors hover:border-brand/40 hover:bg-brand-tint/40"
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
                            {km != null && km < 100 && (
                              <> · {km < 10 ? km.toFixed(1) : Math.round(km)} km</>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
