import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * One notification for one recipient (fan-out model — a role/broadcast event
 * writes one row per resolved user, so each user owns their own read state).
 */
@Index(['userId', 'createdAt'])
@Index(['userId', 'readAt'])
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Recipient staff user. */
  @Column({ type: 'uuid' })
  userId: string;

  /** Grouping bucket, e.g. "orders". */
  @Column({ type: 'varchar' })
  category: string;

  /** Specific event, e.g. "order.placed". */
  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  body: string | null;

  /** Deep-link + render context, e.g. { orderId, orderNumber }. */
  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown> | null;

  @Column({ type: 'varchar', default: 'normal' })
  priority: NotificationPriority;

  /** Branch the event belongs to (for future branch-scoped filtering). */
  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
