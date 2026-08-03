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
}
