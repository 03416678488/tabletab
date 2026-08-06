import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';

import { TenantRequest } from '@modules/tenancy/tenancy.types';
import { constantTimeEqual, openConfig, sealConfig } from '@cor/crypto/secret-cipher';

import { Integration } from './entities/integration.entity';
import { IntegrationSyncLog } from './entities/integration-sync-log.entity';
import { SyncLogEntry, writeSyncLog } from './integration-sync-log.util';
import { ensureFreshToken } from './oauth-refresh';
import { Connector, INTEGRATION_CATALOG, findConnector } from './integration.catalog';

/** A catalog entry merged with the current tenant's connection state. The stored
 *  `config` (credentials) is never returned; `webhookToken` IS (it's a per-tenant
 *  capability the owner needs to build the provider's callback URL). */
export type CatalogItem = Connector & {
  connected: boolean;
  connectedAt: Date | null;
  lastSyncAt: Date | null;
  webhookToken: string | null;
};

@Injectable()
export class IntegrationService {
  constructor(
    @InjectRepository(Integration)
    private readonly _repo: Repository<Integration>,
    @InjectRepository(IntegrationSyncLog)
    private readonly _logs: Repository<IntegrationSyncLog>,
    @Inject(REQUEST) private readonly _req: TenantRequest,
  ) {}

  /** Record a sync event (best-effort). */
  log(entry: SyncLogEntry): Promise<void> {
    return writeSyncLog(this._logs, entry);
  }

  /** Recent sync events for a provider (newest first). */
  getLogs(provider: string, limit = 20): Promise<IntegrationSyncLog[]> {
    return this._logs.find({
      where: { provider },
      order: { createdAt: 'DESC' },
      take: Math.min(100, Math.max(1, limit)),
    });
  }

  /** The full marketplace catalog, annotated with this tenant's connections. */
  async getCatalog(): Promise<CatalogItem[]> {
    const rows = await this._repo.find();
    const byProvider = new Map(rows.map((r) => [r.provider, r]));
    return INTEGRATION_CATALOG.map((c) => {
      const row = byProvider.get(c.key);
      const config = openConfig(row?.config as Record<string, unknown> | null);
      return {
        ...c,
        connected: row?.status === 'connected',
        connectedAt: row?.connectedAt ?? null,
        lastSyncAt: row?.lastSyncAt ?? null,
        webhookToken:
          row?.status === 'connected' && typeof config.webhookToken === 'string'
            ? config.webhookToken
            : null,
      };
    });
  }

  /** A per-tenant webhook token: `<slug>.<secret>`. The slug prefix lets the
   *  tenant middleware route a fixed provider callback URL to the right tenant;
   *  the secret authenticates it. */
  private newWebhookToken(): string {
    const slug = this._req.tenant?.slug ?? 'default';
    return `${slug}.${randomBytes(18).toString('hex')}`;
  }

  /** Stamp a provider's last outbound sync time. */
  async markSynced(provider: string): Promise<void> {
    await this._repo.update({ provider }, { lastSyncAt: new Date() });
  }

  /** Connect / update a provider's config. */
  async connect(
    provider: string,
    config: Record<string, unknown> | undefined,
  ): Promise<{ success: true }> {
    const connector = findConnector(provider);
    if (!connector) throw new NotFoundException('Unknown integration');
    if (connector.status !== 'available') {
      throw new BadRequestException('This integration is not available yet');
    }
    if (connector.authType === 'builtin') {
      throw new BadRequestException('This integration is managed from its own settings');
    }

    const existing = await this._repo.findOne({ where: { provider } });
    // Decrypt existing config so the merge (and re-seal) never double-encrypts.
    const existingConfig = openConfig(existing?.config as Record<string, unknown> | null);
    // Preserve a webhook token across reconnects; mint one for webhook providers.
    const webhookToken =
      (typeof existingConfig.webhookToken === 'string' ? existingConfig.webhookToken : undefined) ??
      (connector.webhookPath ? this.newWebhookToken() : undefined);

    const merged: Record<string, unknown> = {
      ...existingConfig,
      ...(config ?? {}),
      ...(webhookToken ? { webhookToken } : {}),
    };
    const sealed = sealConfig(merged);

    if (existing) {
      existing.status = 'connected';
      existing.config = sealed;
      existing.connectedAt = new Date();
      await this._repo.save(existing);
    } else {
      await this._repo.save(
        this._repo.create({
          provider,
          status: 'connected',
          config: sealed,
          connectedAt: new Date(),
        }),
      );
    }
    return { success: true };
  }

  /** Internal: the stored config for a *connected* provider (incl. secrets), or
   *  null if the provider isn't connected. Never exposed via the API. */
  async getConnectedConfig(provider: string): Promise<Record<string, unknown> | null> {
    const row = await this._repo.findOne({ where: { provider, status: 'connected' } });
    return row ? openConfig(row.config as Record<string, unknown> | null) : null;
  }

  /** Connected config with a freshly-refreshed OAuth token (for outbound calls). */
  async getLiveConfig(provider: string): Promise<Record<string, unknown> | null> {
    const config = await this.getConnectedConfig(provider);
    return config ? ensureFreshToken(this._repo, provider, config) : null;
  }

  // ── OAuth (authorization code) ─────────────────────────────────────────────

  private oauthRedirectUri(provider: string): string {
    const base = process.env.API_PUBLIC_URL || 'http://localhost:3003/api';
    return `${base.replace(/\/$/, '')}/integrations/${provider}/oauth/callback`;
  }

  /** Build the provider authorize URL + persist a CSRF `state` on the row. */
  async startOAuth(provider: string): Promise<{ url: string }> {
    const connector = findConnector(provider);
    if (connector?.authType !== 'oauth' || !connector.oauth) {
      throw new BadRequestException('This integration does not use OAuth');
    }
    const clientId = process.env[connector.oauth.clientIdEnv];
    if (!clientId) {
      throw new BadRequestException(`OAuth not configured — set ${connector.oauth.clientIdEnv}`);
    }

    const state = `${this._req.tenant?.slug ?? 'default'}.${randomBytes(18).toString('hex')}`;
    const existing = await this._repo.findOne({ where: { provider } });
    const merged = sealConfig({
      ...openConfig(existing?.config as Record<string, unknown> | null),
      oauthState: state,
    });
    if (existing) {
      existing.config = merged;
      await this._repo.save(existing);
    } else {
      await this._repo.save(
        this._repo.create({ provider, status: 'disconnected', config: merged }),
      );
    }

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: this.oauthRedirectUri(provider),
      scope: connector.oauth.scopes,
      state,
    });
    return { url: `${connector.oauth.authorizeUrl}?${params.toString()}` };
  }

  /** Verify `state`, exchange `code` for tokens, store them, mark connected. */
  async completeOAuth(
    provider: string,
    code: string | undefined,
    state: string | undefined,
  ): Promise<void> {
    const connector = findConnector(provider);
    if (!connector?.oauth) throw new BadRequestException('This integration does not use OAuth');
    if (!code) throw new BadRequestException('Missing authorization code');

    const row = await this._repo.findOne({ where: { provider } });
    const config = openConfig(row?.config as Record<string, unknown> | null);
    const savedState = typeof config.oauthState === 'string' ? config.oauthState : undefined;
    if (!row || !constantTimeEqual(state ?? '', savedState)) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    const clientId = process.env[connector.oauth.clientIdEnv];
    const clientSecret = process.env[connector.oauth.clientSecretEnv];
    if (!clientId || !clientSecret) throw new BadRequestException('OAuth not configured');

    const res = await fetch(connector.oauth.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.oauthRedirectUri(provider),
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });
    if (!res.ok) throw new BadRequestException(`Token exchange failed (${res.status})`);
    const tokens = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };

    const next: Record<string, unknown> = { ...config };
    delete next.oauthState;
    next.accessToken = tokens.access_token ?? '';
    if (tokens.refresh_token) next.refreshToken = tokens.refresh_token;
    if (tokens.expires_in) {
      next.tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    }

    row.config = sealConfig(next);
    row.status = 'connected';
    row.connectedAt = new Date();
    await this._repo.save(row);
  }

  /** Disconnect a provider (removes its stored config). */
  async disconnect(provider: string): Promise<{ success: true }> {
    if (!findConnector(provider)) throw new NotFoundException('Unknown integration');
    await this._repo.delete({ provider });
    return { success: true };
  }
}
