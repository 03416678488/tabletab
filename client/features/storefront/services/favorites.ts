import { resolveApiBaseUrl } from "@/lib/api-base";

const BASE = resolveApiBaseUrl();

/** Unwrap the API's `{ _metaData, data }` envelope. */
function unwrap<T>(json: unknown): T {
  const j = json as { data?: T } | T;
  return (j && typeof j === "object" && "data" in (j as object) ? (j as { data: T }).data : j) as T;
}

async function request<T>(path: string, init: RequestInit, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Favorites request failed (${res.status})`);
  return unwrap<T>(json);
}

/** All routes return the authoritative id list so the client can reconcile. */
export async function fetchFavoriteIds(token: string): Promise<string[]> {
  const r = await request<{ itemIds: string[] }>("/customer-favorites", { method: "GET" }, token);
  return r.itemIds ?? [];
}

export async function addFavoriteRemote(token: string, itemId: string): Promise<string[]> {
  const r = await request<{ itemIds: string[] }>(
    `/customer-favorites/${itemId}`,
    { method: "POST" },
    token,
  );
  return r.itemIds ?? [];
}

export async function removeFavoriteRemote(token: string, itemId: string): Promise<string[]> {
  const r = await request<{ itemIds: string[] }>(
    `/customer-favorites/${itemId}`,
    { method: "DELETE" },
    token,
  );
  return r.itemIds ?? [];
}
