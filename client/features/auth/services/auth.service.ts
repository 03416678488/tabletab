import "server-only";

import { AUTH_ENDPOINTS } from "@/features/auth/constants/auth.constants";
import type {
  LoginCredentials,
  LoginResponse,
  RefreshResponse,
} from "@/features/auth/types/auth.types";

/**
 * Server-side auth calls used INSIDE the NextAuth credentials flow.
 *
 * Why not the shared `lib/httpClient`? That client is built for the browser: it
 * pulls the bearer token from the NextAuth session (getSession) and, on any 401,
 * calls signOut() + `window.location` redirect. During a login attempt a wrong
 * password legitimately returns 401 — routing that through httpClient would
 * force-redirect instead of surfacing an inline error, and `window`/getSession
 * don't exist in the `authorize()` server context anyway. So the credential
 * exchange uses a plain server fetch here; every *authenticated* app→API call
 * still goes through httpClient.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** Error carrying the API's HTTP status so callers can distinguish 401 from 5xx. */
export class AuthRequestError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AuthRequestError";
    this.statusCode = statusCode;
  }
}

function firstMessage(payload: unknown, fallback: string): string {
  const p = payload as
    | { _metaData?: { message?: unknown }; message?: unknown; errors?: unknown }
    | undefined;
  const candidates = [p?._metaData?.message, p?.message, p?.errors];
  for (const c of candidates) {
    if (typeof c === "string") return c;
    if (Array.isArray(c) && c.length) {
      const m = c[0];
      if (typeof m === "string") return m;
      if (m && typeof m === "object" && typeof m.message === "string") return m.message;
    }
  }
  return fallback;
}

async function postJson<T>(endpoint: string, body: unknown, bearer?: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new AuthRequestError("NEXT_PUBLIC_API_BASE_URL is not configured", 500);
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new AuthRequestError(firstMessage(json, res.statusText), res.status);
  }

  // Unwrap { _metaData, data }.
  return (json as { data: T }).data;
}

export function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return postJson<LoginResponse>(AUTH_ENDPOINTS.login, credentials);
}

/** POST /auth/refresh — the refresh token is sent as the bearer credential. */
export function refresh(refreshToken: string): Promise<RefreshResponse> {
  return postJson<RefreshResponse>(AUTH_ENDPOINTS.refresh, {}, refreshToken);
}

/** POST /auth/logout — revokes the refresh-session family server-side. */
export function logout(refreshToken: string): Promise<{ message: string }> {
  return postJson<{ message: string }>(AUTH_ENDPOINTS.logout, {}, refreshToken);
}
