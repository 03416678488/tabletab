import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { TenantRecord } from './tenancy.types';

const SELECT = `SELECT id, slug, "dbName", "dbHost", status, plan FROM tenants`;

/**
 * Reads the control-plane tenant registry (the console's database) to map an
 * incoming request to a tenant. Kept independent of the app's ORM entities — it
 * queries the registry with a dedicated, lazily-opened connection and caches
 * results briefly so hot paths don't hit the DB every request.
 */
@Injectable()
export class TenantRegistryService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantRegistryService.name);
  private ds: DataSource | null = null;
  private readonly cache = new Map<string, { rec: TenantRecord | null; at: number }>();
  private readonly ttlMs = 30_000;

  private async source(): Promise<DataSource> {
    if (this.ds?.isInitialized) return this.ds;
    this.ds = new DataSource({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.CONTROL_PLANE_DB || 'tabletap_console',
    });
    await this.ds.initialize();
    return this.ds;
  }

  private fromCache(key: string): TenantRecord | null | undefined {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < this.ttlMs) return hit.rec;
    return undefined;
  }

  private async query(where: string, param: string): Promise<TenantRecord | null> {
    try {
      const ds = await this.source();
      const rows = (await ds.query(`${SELECT} WHERE ${where} LIMIT 1`, [param])) as TenantRecord[];
      return rows[0] ?? null;
    } catch (err) {
      // Registry unreachable/misconfigured → resolve to no tenant (default DB).
      this.logger.warn(`Registry lookup failed (${where}): ${(err as Error).message}`);
      return null;
    }
  }

  /** Resolve by full hostname: custom storefront/admin domain, else subdomain label. */
  async resolveByHost(host: string): Promise<TenantRecord | null> {
    const clean = host.toLowerCase().split(':')[0];
    const cached = this.fromCache(`host:${clean}`);
    if (cached !== undefined) return cached;

    let rec = await this.query(`"storefrontDomain" = $1 OR "adminDomain" = $1`, clean);
    if (!rec) {
      const label = clean.split('.')[0]; // acme.yourapp.com → acme
      rec = await this.query(`subdomain = $1`, label);
    }
    this.cache.set(`host:${clean}`, { rec, at: Date.now() });
    return rec;
  }

  async resolveBySlug(slug: string): Promise<TenantRecord | null> {
    const key = `slug:${slug}`;
    const cached = this.fromCache(key);
    if (cached !== undefined) return cached;
    const rec = await this.query(`slug = $1`, slug);
    this.cache.set(key, { rec, at: Date.now() });
    return rec;
  }

  async resolveById(id: string): Promise<TenantRecord | null> {
    const key = `id:${id}`;
    const cached = this.fromCache(key);
    if (cached !== undefined) return cached;
    const rec = await this.query(`id = $1`, id);
    this.cache.set(key, { rec, at: Date.now() });
    return rec;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.ds?.isInitialized) await this.ds.destroy();
  }
}
