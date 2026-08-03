import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TenantStatus = 'provisioning' | 'active' | 'suspended';

/**
 * Control-plane record for one restaurant (tenant). This lives in the console's
 * own database — NOT in a tenant's database. It's the source of truth for
 * routing (which hostname → which tenant → which database) and lifecycle.
 */
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  /** URL-safe handle, e.g. "acme". Drives the default subdomain and db name. */
  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'varchar', default: 'provisioning' })
  status: TenantStatus;

  @Column({ type: 'varchar', default: 'trial' })
  plan: string;

  /** Always-on address, e.g. "acme" → acme.yourapp.com. */
  @Column({ type: 'varchar', unique: true })
  subdomain: string;

  /** Customer's own storefront apex, e.g. "acme.com" (null until mapped). */
  @Column({ type: 'varchar', nullable: true })
  storefrontDomain: string | null;

  /** Customer's own admin host, e.g. "restaurant.acme.com" (null until mapped). */
  @Column({ type: 'varchar', nullable: true })
  adminDomain: string | null;

  /** Physical database for this tenant, e.g. "tenant_acme". */
  @Column({ type: 'varchar', unique: true })
  dbName: string;

  /** DB host — null uses the platform default host. */
  @Column({ type: 'varchar', nullable: true })
  dbHost: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
