import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Append-only record of a consequential platform action (who did what, to which
 * target). Lives in the control-plane DB. Written by the audit interceptor when a
 * mutating platform-admin request succeeds; never updated or deleted in normal use.
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Platform admin who performed the action (null for public/self-serve). */
  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', nullable: true })
  actorEmail: string | null;

  /** Dotted verb, e.g. "tenant.create", "domain.verify". */
  @Index()
  @Column({ type: 'varchar' })
  action: string;

  /** What kind of thing was acted on, e.g. "tenant", "domain". */
  @Column({ type: 'varchar', nullable: true })
  targetType: string | null;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  targetId: string | null;

  /** Human-readable one-liner for the console feed. */
  @Column({ type: 'varchar', nullable: true })
  summary: string | null;

  /** Extra structured context (request params, resulting status, …). */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  ip: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
