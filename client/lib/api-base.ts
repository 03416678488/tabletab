const CONFIGURED_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * The API base URL to call from the current execution context.
 *
 * - **Server** (SSR / NextAuth authorize / route handlers): the absolute
 *   configured URL (e.g. http://localhost:3003/api) — a direct server→API call.
 * - **Browser**: a same-origin RELATIVE path (e.g. "/api"). `next.config`
 *   rewrites `/api/*` to the backend, so requests ride whatever host served the
 *   page — localhost, a LAN IP, or a single Cloudflare tunnel — with no CORS and
 *   no second tunnel. Used by every client-side caller (httpClient + direct
 *   fetch/EventSource).
 */
export function resolveApiBaseUrl(): string {
  if (typeof window === "undefined") return CONFIGURED_API_BASE_URL;
  try {
    // Just the path (e.g. "/api") → same-origin request, proxied by Next.
    return new URL(CONFIGURED_API_BASE_URL).pathname.replace(/\/$/, "") || "/api";
  } catch {
    // Already relative (or unset) — use as configured, defaulting to /api.
    return CONFIGURED_API_BASE_URL || "/api";
  }
}
