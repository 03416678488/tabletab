import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';

import { TenantRequest } from '@modules/tenancy/tenancy.types';
import { openConfig, sealConfig } from '@cor/crypto/secret-cipher';

import { Integration } from './entities/integration.entity';
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
    @Inject(REQUEST) private readonly _req: TenantRequest,
  ) {}

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

  /** Disconnect a provider (removes its stored config). */
  async disconnect(provider: string): Promise<{ success: true }> {
    if (!findConnector(provider)) throw new NotFoundException('Unknown integration');
    await this._repo.delete({ provider });
    return { success: true };
  }
}
