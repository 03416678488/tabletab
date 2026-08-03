import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Tenant } from './entities/tenant.entity';

/**
 * Stands up (and tears down) the physical database for a tenant.
 *
 * DB-per-tenant "create → migrate → seed" is done by cloning a **template
 * database** — a pre-migrated + seeded restaurant DB. Postgres `CREATE DATABASE
 * ... TEMPLATE x` copies the whole schema + base data instantly, so every tenant
 * starts from an identical, ready-to-use restaurant DB. Set TENANT_TEMPLATE_DB
 * to that template. Without it, an empty database is created (schema then applied
 * by the tenant API's own migrate step).
 */
@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly _repo: Repository<Tenant>,
  ) {}

  /** Postgres identifiers can't be parameterized — validate then double-quote. */
  private ident(name: string): string {
    if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
      throw new BadRequestException(`Unsafe database identifier: ${name}`);
    }
    return `"${name}"`;
  }

  /** A short-lived connection to the maintenance DB (CREATE/DROP run here). */
  private adminDataSource(): DataSource {
    return new DataSource({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: 'postgres',
    });
  }

  /**
   * Create the tenant's database (idempotent) and mark the tenant active.
   * Kept synchronous+awaited so the caller learns the real outcome; wrap in a
   * queue/worker later if provisioning grows heavy.
   */
  async provision(id: string): Promise<Tenant> {
    const tenant = await this._repo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const ds = this.adminDataSource();
    await ds.initialize();
    try {
      const [{ exists }] = await ds.query(
        `SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists`,
        [tenant.dbName],
      );

      if (!exists) {
        const template = process.env.TENANT_TEMPLATE_DB?.trim();
        const dbIdent = this.ident(tenant.dbName);

        if (template) {
          const tplIdent = this.ident(template);
          // Template must have no active sessions during the copy.
          await ds.query(
            `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
             WHERE datname = $1 AND pid <> pg_backend_pid()`,
            [template],
          );
          await ds.query(`CREATE DATABASE ${dbIdent} TEMPLATE ${tplIdent}`);
          this.logger.log(`Created ${tenant.dbName} from template ${template}`);
        } else {
          await ds.query(`CREATE DATABASE ${dbIdent}`);
          this.logger.warn(
            `Created empty ${tenant.dbName} (no TENANT_TEMPLATE_DB set — schema not applied)`,
          );
        }
      } else {
        this.logger.log(`Database ${tenant.dbName} already exists — skipping create`);
      }

      tenant.status = 'active';
      return await this._repo.save(tenant);
    } finally {
      await ds.destroy();
    }
  }

  /**
   * Drop a tenant's database. Destructive and irreversible — the caller must
   * confirm intent. Terminates active connections first.
   */
  async deprovision(id: string): Promise<void> {
    const tenant = await this._repo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const ds = this.adminDataSource();
    await ds.initialize();
    try {
      await ds.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
         WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [tenant.dbName],
      );
      await ds.query(`DROP DATABASE IF EXISTS ${this.ident(tenant.dbName)}`);
      this.logger.log(`Dropped database ${tenant.dbName}`);
    } finally {
      await ds.destroy();
    }
  }
}
