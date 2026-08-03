/**
 * Auth feature types.
 *
 * The API wraps every response as { _metaData, data } (see httpClient's
 * ApiResponse<T>). The types below describe the `data` payloads only.
 */

/** FormattedRoles from the API: { [roleName]: { [resource]: actions[] } }. */
export type FormattedRoles = Record<string, Record<string, string[]>>;

export interface AuthTokens {
  token: string;
  refreshToken: string;
  /** ISO strings once serialized over the wire. */
  tokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

/** `data` of POST /auth/login. */
export interface LoginResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles: FormattedRoles;
  tokens: AuthTokens;
}

/** `data` of POST /auth/refresh. */
export interface RefreshResponse {
  tokens: AuthTokens;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/** Flat, session-friendly view of the authenticated user. */
export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Role names granted to the user, e.g. ["Admin"]. */
  roleNames: string[];
  /** Full permission map, kept for sidebar/route authorization later. */
  roles: FormattedRoles;
}
