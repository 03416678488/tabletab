import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { Branch } from '@modules/branch/entities/branch.entity';
import { Table } from '@modules/table/entities/table.entity';

export type ReservationStatus =
  | 'requested'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'no-show'
  | 'cancelled';

export type ReservationSource = 'online' | 'phone' | 'walk-in';

@Index(['branchId', 'date'])
@Entity('reservations')
export class Reservation extends AbstractEntity {
  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  /** Assigned table (may be null until a host seats the party). */
  @Column({ type: 'uuid', nullable: true })
  tableId: string | null;

  @ManyToOne(() => Table, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tableId' })
  table: Table;

  @Column({ type: 'int', default: 2 })
  partySize: number;

  /** YYYY-MM-DD */
  @Column({ type: 'varchar' })
  date: string;

  /** HH:mm (24h) slot start */
  @Column({ type: 'varchar' })
  time: string;

  @Column({ type: 'int', default: 90 })
  durationMins: number;

  @Column({ type: 'varchar' })
  guestName: string;

  @Column({ type: 'varchar' })
  guestPhone: string;

  @Column({ type: 'varchar', nullable: true })
  guestEmail: string | null;

  @Column({ type: 'varchar', nullable: true })
  specialRequests: string | null;

  @Column({ type: 'varchar', default: 'requested' })
  status: ReservationStatus;

  @Column({ type: 'varchar', default: 'online' })
  source: ReservationSource;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  seatedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}
