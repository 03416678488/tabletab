import * as bcrypt from 'bcryptjs';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { TenantService } from '@modules/tenant/tenant.service';
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

  constructor(private readonly _tenants: TenantService) {}

  /** The apex the platform serves tenant subdomains under. */
  private get appDomain(): string {
    return process.env.PLATFORM_APP_DOMAIN?.trim() || 'yourapp.com';
  }

  /** Short-lived connection to a specific tenant database (raw queries only). */
  private tenantDataSource(dbName: string): DataSource {
    return new DataSource({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: dbName,
    });
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
      await this.seedOwner(tenant.dbName, dto);
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

  /**
   * Create the first admin user inside the freshly-cloned tenant database and
   * grant it the Admin role by copying that role's existing permission links
   * (the template is pre-seeded, so this mirrors a real admin exactly).
   */
  private async seedOwner(dbName: string, dto: SignupDto): Promise<void> {
    const ds = this.tenantDataSource(dbName);
    await ds.initialize();
    try {
      const existing = await ds.query(
        `SELECT id FROM users WHERE email = $1 LIMIT 1`,
        [dto.email],
      );
      if (existing.length) {
        throw new BadRequestException('An account with this email already exists');
      }

      const [{ id: adminRoleId }] = (await ds.query(
        `SELECT id FROM roles WHERE name = 'Admin' LIMIT 1`,
      )) as { id: number }[];
      if (!adminRoleId) {
        throw new Error('Template DB missing the Admin role');
      }

      const hashed = await bcrypt.hash(dto.password, 10);
      const [{ id: userId }] = (await ds.query(
        `INSERT INTO users ("firstName", "lastName", email, password, "phoneNumber", "emailVerified", "isActive")
         VALUES ($1, $2, $3, $4, $5, true, true) RETURNING id`,
        ['Owner', '', dto.email, hashed, dto.phoneNumber ?? ''],
      )) as { id: string }[];

      // Grant Admin by cloning the role's permission links onto the new user.
      const linked = await ds.query(
        `INSERT INTO user_role_permissions ("userId", "roleId", "permissionId")
         SELECT DISTINCT $1::uuid, "roleId", "permissionId"
         FROM user_role_permissions WHERE "roleId" = $2`,
        [userId, adminRoleId],
      );
      // linked is [rows, affectedCount] for INSERT..SELECT; log the count if present.
      this.logger.log(
        `Seeded owner ${dto.email} in ${dbName} with Admin role (user ${userId})`,
      );
      void linked;
    } finally {
      await ds.destroy();
    }
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
