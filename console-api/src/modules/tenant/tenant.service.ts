import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tenant } from './entities/tenant.entity';
import { ProvisioningService } from './provisioning.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  UpdateTenantStatusDto,
} from './dto/tenant.dto';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly _repo: Repository<Tenant>,
    private readonly _provisioning: ProvisioningService,
  ) {}

  list(): Promise<Tenant[]> {
    return this._repo.find({ order: { createdAt: 'DESC' } });
  }

  async getById(id: string): Promise<Tenant> {
    const found = await this._repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Tenant not found');
    return found;
  }

  /**
   * Register a tenant in the control plane. Provisioning the actual database
   * (create DB → migrate → seed) is a later step; this row is created in the
   * `provisioning` state so the pipeline can pick it up.
   */
  async create(dto: CreateTenantDto): Promise<Tenant> {
    const clash = await this._repo.findOne({ where: { slug: dto.slug } });
    if (clash) throw new ConflictException('A tenant with this slug already exists');

    const tenant = await this._repo.save(
      this._repo.create({
        name: dto.name,
        slug: dto.slug,
        plan: dto.plan ?? 'trial',
        status: 'provisioning',
        subdomain: dto.slug,
        dbName: `tenant_${dto.slug.replace(/-/g, '_')}`,
      }),
    );

    // Stand up the database immediately. If it fails, the tenant stays in
    // `provisioning` and can be retried from the console — creation still succeeds.
    try {
      return await this._provisioning.provision(tenant.id);
    } catch (err) {
      this.logger.error(`Provisioning failed for ${tenant.slug}`, err as Error);
      return tenant;
    }
  }

  /** Retry provisioning for a tenant stuck in `provisioning`. */
  provision(id: string): Promise<Tenant> {
    return this._provisioning.provision(id);
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.getById(id);
    Object.assign(tenant, {
      name: dto.name ?? tenant.name,
      plan: dto.plan ?? tenant.plan,
      storefrontDomain: dto.storefrontDomain ?? tenant.storefrontDomain,
      adminDomain: dto.adminDomain ?? tenant.adminDomain,
    });
    return this._repo.save(tenant);
  }

  async setStatus(id: string, dto: UpdateTenantStatusDto): Promise<Tenant> {
    const tenant = await this.getById(id);
    tenant.status = dto.status;
    return this._repo.save(tenant);
  }

  /**
   * Delete a tenant AND drop its database. Irreversible — the caller must confirm
   * by passing the tenant's own handle (slug), so a stray DELETE can't nuke data.
   */
  async remove(id: string, confirm?: string): Promise<{ message: string }> {
    const tenant = await this.getById(id);
    if (confirm !== tenant.slug) {
      throw new BadRequestException(
        `This permanently deletes the tenant and drops its database. Confirm by passing its handle ("${tenant.slug}").`,
      );
    }
    await this._provisioning.deprovision(id); // drops the database first
    await this._repo.delete(id); // then remove the registry row
    return { message: `Tenant "${tenant.slug}" deleted and its database dropped` };
  }
}
