import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';

@Index(['name'], { unique: true })
@Entity('branches')
export class Branch extends AbstractEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  address: string;

  @Column({ type: 'varchar' })
  city: string;

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string;

  @Column({ type: 'boolean', default: true })
  isOpen: boolean;

  @Column({ type: 'double precision', nullable: true })
  lat: number;

  @Column({ type: 'double precision', nullable: true })
  lng: number;

  /** Per-day weekly hours as a structured object; null = inherit global opening times. */
  @Column({ type: 'jsonb', nullable: true })
  openingHours: Record<string, unknown> | null;

  @Column({ type: 'double precision', nullable: true })
  deliveryFee: number;

  @Column({ type: 'double precision', nullable: true })
  minOrder: number;

  @Column({ type: 'boolean', default: true })
  onlineOrderingEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  deliveryEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  pickupEnabled: boolean;

  @Column({ type: 'int', nullable: true })
  deliveryEtaMinutes: number;

  // ── Reservation settings (per branch) ──
  @Column({ type: 'boolean', default: true })
  reservationsEnabled: boolean;

  /** Table turn time (minutes) — the default booking duration. */
  @Column({ type: 'int', default: 90 })
  reservationTurnMins: number;

  /** How long before the slot to remind the guest (minutes). */
  @Column({ type: 'int', default: 30 })
  reservationReminderLeadMins: number;

  /** Grace period after the slot before a booking is auto no-show (minutes). */
  @Column({ type: 'int', default: 15 })
  reservationNoShowGraceMins: number;

  /** How far ahead guests may book (days). */
  @Column({ type: 'int', default: 14 })
  reservationBookingWindowDays: number;

  /** Latest a booking may be made before the slot (minutes). */
  @Column({ type: 'int', default: 60 })
  reservationCutoffMins: number;
}
