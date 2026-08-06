import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A tenant's connection to one marketplace provider. The provider *catalog*
 * itself is static code (`integration.catalog.ts`); this row only holds the
 * per-tenant connection state + config. One row per provider (the tenant DB is
 * already per-tenant, so `provider` is unique here).
 */
@Index(['provider'], { unique: true })
@Entity('tenant_integrations')
export class Integration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Catalog key, e.g. "stripe". */
  @Column({ type: 'varchar' })
  provider: string;

  @Column({ type: 'varchar', default: 'connected' })
  status: 'connected' | 'disconnected';

  /** Provider config / credentials (Phase 1: plain; encrypt before prod). */
  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, unknown> | null;

  @Column({ type: 'timestamp', nullable: true })
  connectedAt: Date | null;

  /** Last outbound sync (e.g. menu push) for this provider. */
  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
