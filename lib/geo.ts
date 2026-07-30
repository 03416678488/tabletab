import type { Branch } from "@/lib/types";

export interface Coords {
  lat: number;
  lng: number;
}

/** Great-circle distance between two points in kilometres (haversine). */
export function distanceKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Finds the branch closest to `coords`. Branches without coordinates are
 * ignored for distance; if none have coordinates we fall back to the first
 * open branch (then the first branch overall) so callers always get a result.
 */
export function nearestBranch(branches: Branch[], coords: Coords | null): Branch | null {
  if (branches.length === 0) return null;

  if (coords) {
    const located = branches
      .filter((b) => typeof b.lat === "number" && typeof b.lng === "number")
      .map((b) => ({ branch: b, km: distanceKm(coords, { lat: b.lat!, lng: b.lng! }) }))
      .sort((a, b) => a.km - b.km);
    if (located.length) return located[0].branch;
  }

  return branches.find((b) => b.isOpen) ?? branches[0];
}

/** Distance from `coords` to a branch, or null when it can't be computed. */
export function branchDistanceKm(branch: Branch, coords: Coords | null): number | null {
  if (!coords || typeof branch.lat !== "number" || typeof branch.lng !== "number") return null;
  return distanceKm(coords, { lat: branch.lat, lng: branch.lng });
}
