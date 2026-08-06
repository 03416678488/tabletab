import { Repository } from 'typeorm';

import { sealConfig } from '@cor/crypto/secret-cipher';

import { Integration } from './entities/integration.entity';
import { findConnector } from './integration.catalog';

/** Refresh the token this early before it expires. */
const EXPIRY_BUFFER_MS = 60_000;

/**
 * For an OAuth provider whose access token is near/at expiry, exchange the
 * refresh token for a new one and persist it (sealed). Returns the config to
 * use — refreshed when it happened, otherwise the input unchanged.
 *
 * Best-effort: any failure returns the existing config (the outbound call may
 * then 401, which its own error path logs). Only refreshes when the expiry is
 * known and imminent, so it never storms the token endpoint.
 */
export async function ensureFreshToken(
  repo: Repository<Integration>,
  provider: string,
  config: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const connector = findConnector(provider);
  if (connector?.authType !== 'oauth' || !connector.oauth) return config;

  const refreshToken = typeof config.refreshToken === 'string' ? config.refreshToken : '';
  if (!refreshToken) return config;

  const expiresAt =
    typeof config.tokenExpiresAt === 'string' ? Date.parse(config.tokenExpiresAt) : NaN;
  if (Number.isNaN(expiresAt) || expiresAt - Date.now() > EXPIRY_BUFFER_MS) return config;

  const clientId = process.env[connector.oauth.clientIdEnv];
  const clientSecret = process.env[connector.oauth.clientSecretEnv];
  if (!clientId || !clientSecret) return config;

  try {
    const res = await fetch(connector.oauth.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });
    if (!res.ok) return config;
    const tokens = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    if (!tokens.access_token) return config;

    const next: Record<string, unknown> = { ...config, accessToken: tokens.access_token };
    if (tokens.refresh_token) next.refreshToken = tokens.refresh_token;
    if (tokens.expires_in) {
      next.tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    }

    await repo.update({ provider }, { config: sealConfig(next) });
    return next;
  } catch {
    return config; // never break the outbound flow
  }
}
