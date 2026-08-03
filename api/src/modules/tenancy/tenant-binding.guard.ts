import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';
import { TenantRegistryService } from './tenant-registry.service';
import { TenantRequest } from './tenancy.types';

/**
 * Enforces that a request cannot ask (via an explicit tenant header) for a
 * different tenant than its **token** is bound to.
 *
 * Safety itself is already guaranteed upstream: the tenant middleware binds the
 * data connection to the *verified* JWT's tenant claim, so headers can never
 * change which database is used. This guard adds the explicit signal — it runs
 * after JwtAuthGuard and rejects (403) when a client sends an `x-tenant-*` header
 * that disagrees with the token, rather than silently ignoring it. Tenant-less
 * tokens (no claim) are unaffected and still resolve by host.
 */
@Injectable()
export class TenantBindingGuard implements CanActivate {
  constructor(private readonly registry: TenantRegistryService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<
      TenantRequest & { user?: AuthenticatedUser }
    >();
    const claim = req.user?.tenant;
    if (!claim) return true; // public route or tenant-less token

    const slug = firstHeader(req.headers['x-tenant-slug']);
    if (slug && slug !== claim.slug) {
      throw new ForbiddenException('Tenant mismatch between token and request');
    }

    const hostHeader = firstHeader(req.headers['x-tenant-host']);
    if (hostHeader) {
      const byHost = await this.registry.resolveByHost(hostHeader);
      if (byHost && byHost.id !== claim.id) {
        throw new ForbiddenException('Tenant mismatch between token and request');
      }
    }
    return true;
  }
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
