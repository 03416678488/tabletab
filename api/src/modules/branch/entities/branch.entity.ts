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

  /** Whether guests can request event bookings (birthdays, weddings, …). */
  @Column({ type: 'boolean', default: true })
  eventsEnabled: boolean;

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

  /** Booking deposit charged per guest to hold a reservation (0 = none). */
  @Column({ type: 'double precision', default: 0 })
  reservationDepositPerGuest: number;

  /**
   * Dine-in (QR) payment timing for this branch:
   *  - `pay_after`  → order goes to the kitchen immediately, settled at the
   *                   table (the current default flow).
   *  - `pay_first`  → the guest must pay online first; the order is held in
   *                   `pending_payment` (off the kitchen board / not occupying
   *                   the table) until the gateway confirms.
   */
  @Column({ type: 'varchar', default: 'pay_after' })
  dineInPaymentMode: 'pay_first' | 'pay_after';
}
