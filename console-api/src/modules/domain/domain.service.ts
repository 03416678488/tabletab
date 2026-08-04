import { promises as dns } from 'dns';
import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tenant } from '@modules/tenant/entities/tenant.entity';
import { TenantDomain } from './entities/tenant-domain.entity';
import { AddDomainDto } from './dto/domain.dto';

/** The DNS label the customer creates the TXT challenge under. */
const CHALLENGE_PREFIX = '_tabletap-challenge';
/** Prefix of the TXT record value; the token follows. */
const CHALLENGE_VALUE_PREFIX = 'tabletap-verify=';

export interface DomainView extends TenantDomain {
  /** Exact DNS record the customer must publish to prove ownership. */
  dns: { recordType: 'TXT'; name: string; value: string };
}

@Injectable()
export class DomainService {
  private readonly logger = new Logger(DomainService.name);

  constructor(
    @InjectRepository(TenantDomain)
    private readonly _repo: Repository<TenantDomain>,
    @InjectRepository(Tenant)
    private readonly _tenants: Repository<Tenant>,
  ) {}

  private challengeName(hostname: string): string {
    return `${CHALLENGE_PREFIX}.${hostname}`;
  }

  /** Attach the DNS instructions a customer needs to a domain row. */
  private view(domain: TenantDomain): DomainView {
    return {
      ...domain,
      dns: {
        recordType: 'TXT',
        name: this.challengeName(domain.hostname),
        value: `${CHALLENGE_VALUE_PREFIX}${domain.verificationToken}`,
      },
    };
  }

  async list(tenantId: string): Promise<DomainView[]> {
    const rows = await this._repo.find({
      where: { tenantId },
      order: { createdAt: 'ASC' },
    });
    return rows.map((d) => this.view(d));
  }

  async add(tenantId: string, dto: AddDomainDto): Promise<DomainView> {
    const tenant = await this._tenants.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const clash = await this._repo.findOne({ where: { hostname: dto.hostname } });
    if (clash) {
      throw new ConflictException(
        clash.tenantId === tenantId
          ? 'This domain is already added to this tenant'
          : 'This domain is already mapped to another tenant',
      );
    }

    const domain = await this._repo.save(
      this._repo.create({
        tenantId,
        hostname: dto.hostname,
        kind: dto.kind,
        verificationToken: randomBytes(16).toString('hex'),
        status: 'pending',
      }),
    );
    this.logger.log(`Domain ${domain.hostname} added to tenant ${tenant.slug} (pending)`);
    return this.view(domain);
  }

  /**
   * Look up the DNS TXT challenge for a domain and, if the token matches, mark it
   * verified and copy the hostname onto the tenant column that routing matches on.
   */
  async verify(id: string): Promise<DomainView> {
    const domain = await this._repo.findOne({ where: { id } });
    if (!domain) throw new NotFoundException('Domain not found');

    const name = this.challengeName(domain.hostname);
    const expected = `${CHALLENGE_VALUE_PREFIX}${domain.verificationToken}`;
    domain.lastCheckedAt = new Date();

    let found: string[] = [];
    try {
      // resolveTxt returns string chunks per record; join chunks, then flatten.
      const records = await dns.resolveTxt(name);
      found = records.map((chunks) => chunks.join(''));
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code ?? 'DNS_ERROR';
      domain.status = 'failed';
      domain.lastError =
        code === 'ENOTFOUND' || code === 'ENODATA'
          ? `No TXT record found at ${name}`
          : `DNS lookup failed (${code})`;
      await this._repo.save(domain);
      return this.view(domain);
    }

    if (!found.includes(expected)) {
      domain.status = 'failed';
      domain.lastError = found.length
        ? `TXT record at ${name} did not contain the expected token`
        : `No TXT record found at ${name}`;
      await this._repo.save(domain);
      return this.view(domain);
    }

    // Verified — activate the hostname for routing.
    domain.status = 'verified';
    domain.verifiedAt = new Date();
    domain.lastError = null;
    await this._repo.save(domain);
    await this.syncTenantColumn(domain);
    this.logger.log(`Domain ${domain.hostname} verified for tenant ${domain.tenantId}`);
    return this.view(domain);
  }

  async remove(id: string): Promise<{ message: string }> {
    const domain = await this._repo.findOne({ where: { id } });
    if (!domain) throw new NotFoundException('Domain not found');

    // If this hostname was the active routing target, clear it so stale hosts
    // stop resolving to the tenant.
    const column = domain.kind === 'admin' ? 'adminDomain' : 'storefrontDomain';
    await this._tenants.update(
      { id: domain.tenantId, [column]: domain.hostname },
      { [column]: null },
    );
    await this._repo.delete(id);
    return { message: `Domain "${domain.hostname}" removed` };
  }

  /** Copy a verified hostname onto the tenant column that host routing matches. */
  private async syncTenantColumn(domain: TenantDomain): Promise<void> {
    const column = domain.kind === 'admin' ? 'adminDomain' : 'storefrontDomain';
    await this._tenants.update(domain.tenantId, { [column]: domain.hostname });
  }
}
