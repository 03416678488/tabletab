/**
 * Browser geolocation helper. `navigator.geolocation` only works in a **secure
 * context** — HTTPS, or `localhost`. On a plain-HTTP origin reached by IP/host
 * (e.g. a phone hitting the dev server over the LAN/Tailscale) the API exists but
 * every call fails, so we surface a clear reason instead of a generic error.
 */
export const GEO_HTTPS_HINT =
  "Location needs a secure connection. Open the site over HTTPS (or on localhost) and try again.";

export type GeoBlockReason = "unsupported" | "insecure" | null;

/** Why geolocation can't run here (null = it can). */
export function geolocationBlockedReason(): GeoBlockReason {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) return "unsupported";
  if (typeof window !== "undefined" && window.isSecureContext === false) return "insecure";
  return null;
}

/**
 * Promise wrapper around `getCurrentPosition` that rejects with a friendly,
 * context-aware `Error` (insecure-context hint, permission denied, timeout…).
 */
export function getCurrentPosition(
  options?: PositionOptions,
): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    const reason = geolocationBlockedReason();
    if (reason === "unsupported") {
      return reject(new Error("Geolocation isn't available on this device."));
    }
    if (reason === "insecure") {
      return reject(new Error(GEO_HTTPS_HINT));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          // Denied on an insecure origin usually IS the secure-context block.
          reject(
            new Error(window.isSecureContext ? "Location permission was denied." : GEO_HTTPS_HINT),
          );
        } else if (err.code === err.TIMEOUT) {
          reject(new Error("Timed out getting your location — try again."));
        } else {
          reject(new Error("Couldn't get your location."));
        }
      },
      options,
    );
  });
}
