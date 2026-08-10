"use client";

import { useState } from "react";
import { LocateFixed, Navigation } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLocationStore } from "@/hooks/use-location-store";
import { nearestBranch } from "@/lib/geo";
import { getCurrentPosition, GEO_HTTPS_HINT } from "@/lib/geolocation";
import { cn } from "@/lib/utils";
import { useStorefrontBranches } from "@/features/storefront/hooks/use-storefront-branches";

interface LocationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Small pre-prompt asking to use the device location. On allow, we resolve the
 * nearest branch; otherwise the user browses all branches. Backend wiring (real
 * branch scoping) is handled elsewhere — this only drives the frontend flow.
 */
export function LocationPermissionDialog({ open, onOpenChange }: LocationPermissionDialogProps) {
  const setBranch = useLocationStore((s) => s.setBranch);
  const setCoords = useLocationStore((s) => s.setCoords);
  const setConfirmed = useLocationStore((s) => s.setConfirmed);
  const setGeoStatus = useLocationStore((s) => s.setGeoStatus);

  // Cached live branches so the branch we pick matches the ids the landing resolves.
  const { branches } = useStorefrontBranches();
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
      onOpenChange(false);
    } catch (err) {
      setDenied(true);
      setGeoStatus("denied");
      if (err instanceof Error && err.message === GEO_HTTPS_HINT) setInsecure(true);
    } finally {
      setLocating(false);
    }
  };

  const browseAll = () => {
    setConfirmed(true);
    onOpenChange(false);
  };

  // Dismissing (X / overlay) = browse all, and don't auto-open again.
  const handleOpenChange = (next: boolean) => {
    if (!next) setConfirmed(true);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-tint text-brand">
          <Navigation className="size-7" />
        </div>
        <DialogTitle className="mt-2 text-center text-xl">Find food near you</DialogTitle>
        <DialogDescription className="text-center">
          Share your location and we&apos;ll show your nearest branch with live delivery times — or
          browse all branches for now.
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
            onClick={browseAll}
            className="w-full rounded-full px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-ink"
          >
            Browse all branches
          </button>
        </div>

        {denied && (
          <p className="mt-1 text-xs text-amber-700">
            {insecure
              ? `${GEO_HTTPS_HINT} You can still browse all branches.`
              : "Couldn't access your location. You can still browse all branches."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
