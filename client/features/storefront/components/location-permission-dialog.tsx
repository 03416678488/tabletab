"use client";

import { useEffect, useState } from "react";
import { LocateFixed, Navigation } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocationStore } from "@/hooks/use-location-store";
import { api } from "@/lib/api";
import { nearestBranch } from "@/lib/geo";
import type { Branch } from "@/lib/types";
import { cn } from "@/lib/utils";

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

  const [branches, setBranches] = useState<Branch[]>([]);
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getBranches().then((list) => {
      if (!cancelled) setBranches(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const allow = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setDenied(true);
      return;
    }
    setLocating(true);
    setDenied(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setGeoStatus("granted");
        const nearest = nearestBranch(branches, c);
        if (nearest) setBranch(nearest.id);
        setConfirmed(true);
        setLocating(false);
        onOpenChange(false);
      },
      () => {
        setLocating(false);
        setDenied(true);
        setGeoStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
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
            onClick={allow}
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
            Couldn&apos;t access your location. You can still browse all branches.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
