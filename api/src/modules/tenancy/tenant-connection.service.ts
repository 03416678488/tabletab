import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { TenantRecord } from './tenancy.types';

/**
 * Owns one DataSource per tenant database, created lazily on first use and cached
 * for reuse. Built from the default DataSource's registered entities so every
 * repository works against the tenant DB exactly as against the default one.
 *
 * Scale controls:
 *  - Each tenant pool is capped (TENANT_DB_POOL_MAX) so `tenants × poolMax` stays
 *    within Postgres `max_connections` (front with PgBouncer for large N).
 *  - Idle tenant connections are evicted (TENANT_CONN_IDLE_MS) by a periodic
 *    sweep (TENANT_CONN_SWEEP_MS), so inactive tenants don't hold connections.
 */
@Injectable()
export class TenantConnectionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TenantConnectionService.name);
  private readonly pool = new Map<string, DataSource>();
  private readonly pending = new Map<string, Promise<DataSource>>();
  private readonly lastUsed = new Map<string, number>();
  private sweepTimer?: NodeJS.Timeout;

  private readonly poolMax = parseInt(process.env.TENANT_DB_POOL_MAX ?? '5', 10);
  private readonly idleMs = parseInt(process.env.TENANT_CONN_IDLE_MS ?? '300000', 10);
  private readonly sweepMs = parseInt(process.env.TENANT_CONN_SWEEP_MS ?? '60000', 10);

  constructor(
    @InjectDataSource()
    private readonly defaultDataSource: DataSource,
  ) {}

  onModuleInit(): void {
    if (this.idleMs > 0 && this.sweepMs > 0) {
      this.sweepTimer = setInterval(() => void this.evictIdle(), this.sweepMs);
      this.sweepTimer.unref?.(); // don't keep the process alive for the sweep
      this.logger.log(
        `Tenant connections: poolMax=${this.poolMax}, idle=${this.idleMs}ms, sweep=${this.sweepMs}ms`,
      );
    }
  }

  async get(tenant: Pick<TenantRecord, 'dbName' | 'dbHost'>): Promise<DataSource> {
    const key = tenant.dbName;
    this.lastUsed.set(key, Date.now());

    const existing = this.pool.get(key);
    if (existing?.isInitialized) return existing;

    const inflight = this.pending.get(key);
    if (inflight) return inflight;

    const open = (async () => {
      const entities = this.defaultDataSource.entityMetadatas.map((m) => m.target);
      const base = this.defaultDataSource.options as {
        host?: string;
        port?: number;
        username?: string;
        password?: string;
      };

      const ds = new DataSource({
        type: 'postgres',
        name: `tenant_${tenant.dbName}`,
        host: tenant.dbHost || process.env.POSTGRES_HOST || base.host || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT ?? '', 10) || base.port || 5432,
        username: process.env.POSTGRES_USER || base.username,
        password: process.env.POSTGRES_PASSWORD || base.password,
        database: tenant.dbName,
        entities: entities as string[],
        synchronize: false,
        poolSize: this.poolMax,
      });
      await ds.initialize();
      this.pool.set(key, ds);
      this.lastUsed.set(key, Date.now());
      this.logger.log(`Opened tenant connection: ${key}`);
      return ds;
    })().finally(() => this.pending.delete(key));

    this.pending.set(key, open);
    return open;
  }

  /** Close and drop tenant pools idle beyond the TTL. */
  private async evictIdle(): Promise<void> {
    const now = Date.now();
    for (const [key, ds] of this.pool) {
      const idle = now - (this.lastUsed.get(key) ?? 0);
      if (idle < this.idleMs) continue;
      this.pool.delete(key);
      this.lastUsed.delete(key);
      try {
        if (ds.isInitialized) await ds.destroy();
        this.logger.log(`Evicted idle tenant connection: ${key} (idle ${Math.round(idle / 1000)}s)`);
      } catch (err) {
        this.logger.warn(`Failed to evict ${key}: ${(err as Error).message}`);
      }
    }
  }

  /** Observability: which tenant pools are open and how idle they are. */
  stats() {
    const now = Date.now();
    return {
      open: this.pool.size,
      poolMax: this.poolMax,
      idleMs: this.idleMs,
      connections: [...this.pool.keys()].map((db) => ({
        db,
        idleSeconds: Math.round((now - (this.lastUsed.get(db) ?? now)) / 1000),
      })),
    };
  }

  async onModuleDestroy(): Promise<void> {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    await Promise.all(
      [...this.pool.values()].map((ds) => (ds.isInitialized ? ds.destroy() : undefined)),
    );
    this.pool.clear();
  }
}
