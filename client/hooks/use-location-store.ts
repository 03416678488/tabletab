"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Coords } from "@/lib/geo";

export type Fulfillment = "delivery" | "pickup" | "reserve";

/** Where the user is in the "find my branch" flow. */
export type GeoStatus =
  | "idle"
  | "prompt" // permission undecided → show our pre-prompt dialog
  | "locating"
  | "granted"
  | "denied"
  | "unsupported";

interface LocationStore {
  /** Currently selected branch id (nearest, or manually chosen). */
  branchId: string | null;
  /** Chosen fulfillment mode for the landing/menu. */
  fulfillment: Fulfillment;
  /** Last known device coordinates, if the user shared location. */
  coords: Coords | null;
  /** Progress of the geolocation permission flow. */
  geoStatus: GeoStatus;
  /** Whether the user has acknowledged the branch picker (so it won't auto-open). */
  confirmed: boolean;

  setBranch: (branchId: string) => void;
  setFulfillment: (fulfillment: Fulfillment) => void;
  setCoords: (coords: Coords | null) => void;
  setGeoStatus: (status: GeoStatus) => void;
  setConfirmed: (confirmed: boolean) => void;
  /** Clear the branch selection so the picker re-opens. */
  reset: () => void;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      branchId: null,
      fulfillment: "delivery",
      coords: null,
      geoStatus: "idle",
      confirmed: false,

      setBranch: (branchId) => set({ branchId }),
      setFulfillment: (fulfillment) => set({ fulfillment }),
      setCoords: (coords) => set({ coords }),
      setGeoStatus: (geoStatus) => set({ geoStatus }),
      setConfirmed: (confirmed) => set({ confirmed }),
      reset: () => set({ branchId: null, geoStatus: "idle", confirmed: false }),
    }),
    {
      name: "tabletab-location",
      // Persist the choice, not the transient geo flow state.
      partialize: (s) => ({
        branchId: s.branchId,
        fulfillment: s.fulfillment,
        coords: s.coords,
        confirmed: s.confirmed,
      }),
    },
  ),
);
