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

  @Column({ type: 'varchar', nullable: true })
  openingHours: string;

  @Column({ type: 'double precision', nullable: true })
  deliveryFee: number;

  @Column({ type: 'double precision', nullable: true })
  minOrder: number;

  @Column({ type: 'boolean', default: true })
  onlineOrderingEnabled: boolean;
}
