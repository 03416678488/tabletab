import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { Branch } from '@modules/branch/entities/branch.entity';
import { EventType } from './event-type.entity';

export type EventStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';

export type EventSource = 'online' | 'phone' | 'walk-in';

/** A guest's event booking / inquiry against a configurable event type. */
@Index(['branchId', 'date'])
@Entity('events')
export class Event extends AbstractEntity {
  @Column({ type: 'uuid', nullable: true })
  eventTypeId: string | null;

  @ManyToOne(() => EventType, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'eventTypeId' })
  eventType: EventType;

  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'varchar' })
  title: string;

  /** YYYY-MM-DD */
  @Column({ type: 'varchar' })
  date: string;

  /** HH:mm (24h) start */
  @Column({ type: 'varchar' })
  startTime: string;

  /** HH:mm (24h) end — optional. */
  @Column({ type: 'varchar', nullable: true })
  endTime: string | null;

  @Column({ type: 'int', default: 1 })
  guestCount: number;

  @Column({ type: 'varchar' })
  guestName: string;

  @Column({ type: 'varchar' })
  guestPhone: string;

  @Column({ type: 'varchar', nullable: true })
  guestEmail: string | null;

  /** Guest's indicative budget. */
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  budget: string | null;

  @Column({ type: 'varchar', nullable: true })
  specialRequests: string | null;

  @Column({ type: 'varchar', default: 'requested' })
  status: EventStatus;

  /** Why the booking was cancelled (set when status → 'cancelled'). */
  @Column({ type: 'varchar', nullable: true })
  cancellationReason: string | null;

  @Column({ type: 'varchar', default: 'online' })
  source: EventSource;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  // ── Payment (earning) ──
  /** Agreed amount collected from the guest (advance/package). 0 = none. */
  @Column({ type: 'double precision', default: 0 })
  paymentAmount: number;

  /** How the payment was taken: 'cash' | 'card' | 'mfs' | 'other'. */
  @Column({ type: 'varchar', nullable: true })
  paymentMethod: string | null;

  /** When staff recorded the payment (posts an `event_payment` txn). */
  @Column({ type: 'timestamptz', nullable: true })
  paymentCollectedAt: Date | null;
}
