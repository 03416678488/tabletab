import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';

/** A single dine-in "sitting" at a table. */
export type TableSessionStatus = 'open' | 'closed';

/**
 * A per-sitting dine-in session. The QR `slug` is permanent (it identifies the
 * table), but access to *place orders on the current bill* is gated by this
 * session's unguessable `token`, which is issued when a sitting starts and dies
 * when the table is settled (or after inactivity). This stops a past customer's
 * saved link from reaching the next customer's order — the token they hold no
 * longer matches the table's open session.
 */
@Index(['token'], { unique: true })
@Index(['tableId', 'status'])
@Entity('table_sessions')
export class TableSession extends AbstractEntity {
  @Column({ type: 'uuid' })
  tableId: string;

  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  /** Unguessable per-sitting capability sent by the client on each order. */
  @Column({ type: 'varchar' })
  token: string;

  @Column({ type: 'varchar', default: 'open' })
  status: TableSessionStatus;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  openedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  /** Last time an order was placed on this session — drives the idle timeout. */
  @Column({ type: 'timestamptz', default: () => 'now()' })
  lastOrderAt: Date;
}
