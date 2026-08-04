import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import * as jwt from 'jsonwebtoken';

import { TenantRegistryService } from './tenant-registry.service';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantRequest } from './tenancy.types';

/**
 * Resolves the tenant for each request and attaches it (plus a ready DataSource)
 * to the request — BEFORE controllers/request-scoped repositories instantiate.
 *
 * Resolution priority:
 *   1. A **verified** JWT's `tenant` claim — authoritative. A token minted for
 *      one tenant therefore always binds to that tenant's DB; a Host / `x-tenant-*`
 *      header cannot override it. (Signature is verified here so the claim can be
 *      trusted; if verification fails we ignore it and let the auth guard reject.)
 *   2. `x-tenant-slug` header — explicit (dev / internal calls).
 *   3. `x-tenant-host` header, then the `Host` header — subdomain / custom domain.
 *
 * Nothing resolved (or registry unreachable) → the request passes through on the
 * default connection, so single-tenant and local dev keep working.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantContextMiddleware.name);

  constructor(
    private readonly registry: TenantRegistryService,
    private readonly connections: TenantConnectionService,
  ) {}

  async use(req: TenantRequest, _res: Response, next: NextFunction): Promise<void> {
    try {
      const claim = this.tenantFromToken(req);

      let tenant = null;
      if (claim?.id) {
        tenant = await this.registry.resolveById(claim.id);
      } else {
        const slug = firstHeader(req.headers['x-tenant-slug']);
        const host = firstHeader(req.headers['x-tenant-host']) ?? req.headers.host;
        tenant = slug
          ? await this.registry.resolveBySlug(slug)
          : host
            ? await this.registry.resolveByHost(host)
            : null;
      }

      if (tenant && tenant.status === 'active') {
        req.tenant = tenant;
        req.tenantDataSource = await this.connections.get(tenant);
      } else {
        req.tenant = tenant ?? null; // resolved-but-suspended stays visible
      }
    } catch (err) {
      this.logger.warn(`Tenant resolution skipped: ${(err as Error).message}`);
      req.tenant = null;
    }
    next();
  }

  /**
   * Read the tenant claim from a *signature-verified* bearer token. Tries the
   * access secret first, then the refresh secret (so /auth/refresh — which sends
   * a refresh token — also binds to the right tenant DB).
   */
  private tenantFromToken(req: TenantRequest): { id: string; slug?: string } | null {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    const token = auth.slice(7);
    for (const secret of [process.env.JWT_SECRET, process.env.REFRESH_JWT_SECRET]) {
      if (!secret) continue;
      try {
        const payload = jwt.verify(token, secret) as {
          tenant?: { id: string; slug?: string } | null;
        };
        return payload?.tenant ?? null;
      } catch {
        // Try the next secret; if all fail, the auth guard will 401 later.
      }
    }
    return null;
  }
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
