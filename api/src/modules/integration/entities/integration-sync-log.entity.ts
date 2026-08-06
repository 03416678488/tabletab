import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type SyncDirection = 'order_in' | 'menu_out' | 'status_out';
export type SyncStatus = 'success' | 'error';

/** One integration sync event (order received, menu pushed, status relayed). */
@Index(['provider', 'createdAt'])
@Entity('integration_sync_logs')
export class IntegrationSyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  provider: string;

  @Column({ type: 'varchar' })
  direction: SyncDirection;

  @Column({ type: 'varchar' })
  status: SyncStatus;

  @Column({ type: 'varchar', nullable: true })
  message: string | null;

  /** Small context, e.g. { orderNumber, externalRef, items }. */
  @Column({ type: 'jsonb', nullable: true })
  meta: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
