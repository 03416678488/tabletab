import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tenant } from '@modules/tenant/entities/tenant.entity';
import { TenantDomain } from '@modules/domain/entities/tenant-domain.entity';

/**
 * Decides which hostnames the edge proxy is allowed to obtain a TLS certificate
 * for. This is the gate behind Caddy/Traefik "on-demand TLS": without it, anyone
 * pointing a domain at the platform could trigger unbounded ACME cert issuance
 * (a real abuse + rate-limit risk). We only authorize hostnames we actually serve.
 */
@Injectable()
export class EdgeService {
  constructor(
    @InjectRepository(TenantDomain)
    private readonly _domains: Repository<TenantDomain>,
    @InjectRepository(Tenant)
    private readonly _tenants: Repository<Tenant>,
  ) {}

  private get appDomain(): string {
    return process.env.PLATFORM_APP_DOMAIN?.trim().toLowerCase() || 'yourapp.com';
  }

  /** True if the platform will serve (and therefore should get a cert for) `host`. */
  async isRoutable(host: string): Promise<boolean> {
    const clean = host.trim().toLowerCase().split(':')[0];
    if (!clean) return false;

    // 1) A custom domain that passed DNS verification.
    const verified = await this._domains.count({
      where: { hostname: clean, status: 'verified' },
    });
    if (verified > 0) return true;

    // 2) A hostname already activated on a tenant (storefront/admin column).
    const onTenant = await this._tenants
      .createQueryBuilder('t')
      .where('t.storefrontDomain = :h OR t.adminDomain = :h', { h: clean })
      .getCount();
    if (onTenant > 0) return true;

    // 3) A live platform subdomain: <label>.<appDomain> where <label> is a tenant.
    const suffix = `.${this.appDomain}`;
    if (clean.endsWith(suffix)) {
      const label = clean.slice(0, -suffix.length);
      if (label && !label.includes('.')) {
        const byLabel = await this._tenants.count({ where: { subdomain: label } });
        if (byLabel > 0) return true;
      }
    }

    return false;
  }
}
