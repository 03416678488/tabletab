import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Tenant } from '@modules/tenant/entities/tenant.entity';

/** Which surface a custom domain points at. */
export type DomainKind = 'storefront' | 'admin';

/** DNS-ownership verification state. A domain only becomes routable once verified. */
export type DomainStatus = 'pending' | 'verified' | 'failed';

/**
 * A customer-owned hostname (e.g. "acme.com" or "restaurant.acme.com") mapped to a
 * tenant. Lives in the control-plane DB. Ownership is proven by a DNS TXT challenge;
 * only when `status = 'verified'` is the hostname copied onto the tenant's
 * storefront/admin column, which is what host→tenant routing actually matches.
 */
@Entity('tenant_domains')
export class TenantDomain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  /** The customer's hostname, lowercased. Unique across the platform. */
  @Column({ type: 'varchar', unique: true })
  hostname: string;

  @Column({ type: 'varchar' })
  kind: DomainKind;

  /** Random secret the customer publishes in a TXT record to prove ownership. */
  @Column({ type: 'varchar' })
  verificationToken: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: DomainStatus;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastCheckedAt: Date | null;

  /** Why the last verification attempt failed (for surfacing in the console). */
  @Column({ type: 'varchar', nullable: true })
  lastError: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
