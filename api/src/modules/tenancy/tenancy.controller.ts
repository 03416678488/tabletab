import { Controller, Get, Req } from '@nestjs/common';

import { Public } from '@modules/auth/guards/public/public.decorator';
import { TenantRequest } from './tenancy.types';
import { resolvePlan } from './plans';
import { TenantConnectionService } from './tenant-connection.service';

/**
 * Demonstrates tenant resolution: reports which tenant (and which physical
 * database) the current request resolved to. Useful for verifying routing and
 * as a template for making real modules tenant-aware (use `req.tenantDataSource`
 * to get repositories bound to the tenant's DB).
 */
@Controller('tenancy')
export class TenancyController {
  constructor(private readonly connections: TenantConnectionService) {}

  /** Open tenant connection pools + idle ages (observability). */
  @Public()
  @Get('pool')
  pool() {
    return this.connections.stats();
  }

  @Public()
  @Get('whoami')
  async whoami(@Req() req: TenantRequest) {
    if (!req.tenant) {
      return { resolved: false, tenant: null, message: 'No tenant — using default connection' };
    }

    let connectedDatabase: string | null = null;
    let userCount: number | null = null;
    if (req.tenantDataSource) {
      const [row] = (await req.tenantDataSource.query(
        `SELECT current_database() AS db, (SELECT count(*)::int FROM users) AS users`,
      )) as { db: string; users: number }[];
      connectedDatabase = row?.db ?? null;
      userCount = row?.users ?? null;
    }

    const plan = resolvePlan(req.tenant.plan);
    return {
      resolved: true,
      tenant: { slug: req.tenant.slug, dbName: req.tenant.dbName, status: req.tenant.status },
      plan: { id: plan.id, label: plan.label, limits: plan.limits, features: plan.features },
      connectedDatabase,
      userCount,
    };
  }
}
