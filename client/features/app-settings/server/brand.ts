const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Server-side fetch of the tenant's real business name (Settings → Company),
 * for `generateMetadata` / server components. Plain fetch (no next-auth) so it's
 * safe outside the React tree. Returns null if unset or the API is unreachable,
 * so callers can fall back to their own default.
 */
export async function fetchBrandNameServer(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/settings`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data ?? json;
    const name = data?.company?.name;
    return typeof name === "string" && name.trim() ? name.trim() : null;
  } catch {
    return null;
  }
}
