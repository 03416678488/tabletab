import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';

/**
 * Admin-configurable catalogue of bookable event kinds (Birthday, Wedding,
 * Corporate, …). Managed under Events → Types; referenced by event bookings.
 */
@Index(['name'], { unique: true })
@Entity('event_types')
export class EventType extends AbstractEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string | null;

  /** Indicative starting price shown to guests (per booking). */
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  basePrice: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
