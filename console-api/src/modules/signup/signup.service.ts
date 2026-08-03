import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { TenantService } from '@modules/tenant/tenant.service';
import { OwnerSeedingService } from '@modules/tenant/owner-seeding.service';
import { Tenant } from '@modules/tenant/entities/tenant.entity';
import { SignupDto } from './dto/signup.dto';

/** Subdomains we never hand out to tenants (platform + common infra labels). */
const RESERVED_HANDLES = new Set([
  'www', 'api', 'app', 'admin', 'console', 'dashboard', 'restaurant',
  'mail', 'smtp', 'ftp', 'ns', 'ns1', 'ns2', 'dns', 'cdn', 'assets',
  'static', 'status', 'support', 'help', 'docs', 'blog', 'staging',
  'dev', 'test', 'demo', 'billing', 'auth', 'login', 'signup',
]);

export interface SignupResult {
  tenant: Tenant;
  subdomain: string;
  storefrontUrl: string;
  adminUrl: string;
  owner: { email: string };
}

@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private readonly _tenants: TenantService,
    private readonly _ownerSeeding: OwnerSeedingService,
  ) {}

  /** The apex the platform serves tenant subdomains under. */
  private get appDomain(): string {
    return process.env.PLATFORM_APP_DOMAIN?.trim() || 'yourapp.com';
  }

  async signup(dto: SignupDto): Promise<SignupResult> {
    if (RESERVED_HANDLES.has(dto.handle)) {
      throw new ConflictException('That handle is reserved — pick another');
    }

    // create() registers the tenant AND provisions its database (clone template).
    const tenant = await this._tenants.create({
      name: dto.restaurantName,
      slug: dto.handle,
      plan: dto.plan ?? 'trial',
    });

    // Provisioning is best-effort inside create(); for self-serve we require the
    // database to be ready so we can seed the owner. Roll back if it isn't.
    if (tenant.status !== 'active') {
      await this.rollback(tenant.id);
      throw new InternalServerErrorException(
        'Could not provision your workspace — please try again',
      );
    }

    try {
      await this._ownerSeeding.seedOwner(tenant.dbName, {
        email: dto.email,
        password: dto.password,
        phoneNumber: dto.phoneNumber,
      });
    } catch (err) {
      this.logger.error(`Owner seeding failed for ${tenant.slug}`, err as Error);
      await this.rollback(tenant.id);
      throw err instanceof BadRequestException
        ? err
        : new InternalServerErrorException('Could not set up your admin account');
    }

    this.logger.log(`Self-serve signup complete: ${tenant.slug} (${dto.email})`);
    return {
      tenant,
      subdomain: tenant.subdomain,
      storefrontUrl: `https://${tenant.subdomain}.${this.appDomain}`,
      adminUrl: `https://${tenant.subdomain}.${this.appDomain}/admin`,
      owner: { email: dto.email },
    };
  }

  /** Undo a half-finished signup: drop the DB and remove the registry row. */
  private async rollback(tenantId: string): Promise<void> {
    try {
      // remove() deprovisions (drops the DB) then deletes the registry row;
      // it self-confirms with the tenant's own slug.
      const t = await this._tenants.getById(tenantId);
      await this._tenants.remove(t.id, t.slug);
    } catch (err) {
      this.logger.warn(`Signup rollback failed: ${(err as Error).message}`);
    }
  }
}
