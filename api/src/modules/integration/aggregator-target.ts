import { findConnector } from './integration.catalog';

export interface OutboundTarget {
  base: string;
  /** Authorization header value, or undefined for none. */
  authHeader?: string;
}

/**
 * Resolve where + how to call a provider's outbound API from its stored config.
 *
 *  - api_key providers: user-set `apiBaseUrl` + optional `apiKey` bearer.
 *  - OAuth providers:   the catalog's fixed `apiBase` + the stored `accessToken`.
 *
 * Returns null when the provider isn't configured for a live call (→ dry run).
 */
export function resolveOutboundTarget(
  provider: string,
  config: Record<string, unknown>,
): OutboundTarget | null {
  const connector = findConnector(provider);
  if (!connector) return null;

  if (connector.authType === 'oauth') {
    const base = connector.apiBase?.replace(/\/$/, '');
    const token = typeof config.accessToken === 'string' ? config.accessToken : '';
    return base && token ? { base, authHeader: `Bearer ${token}` } : null;
  }

  const base =
    typeof config.apiBaseUrl === 'string' ? config.apiBaseUrl.trim().replace(/\/$/, '') : '';
  if (!base) return null;
  const key = typeof config.apiKey === 'string' && config.apiKey ? config.apiKey : undefined;
  return { base, authHeader: key ? `Bearer ${key}` : undefined };
}

/** Fetch headers for a target (JSON + auth). */
export function targetHeaders(target: OutboundTarget): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(target.authHeader ? { Authorization: target.authHeader } : {}),
  };
}
