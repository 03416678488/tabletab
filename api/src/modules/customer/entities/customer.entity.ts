import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';

@Entity('customers')
export class Customer extends AbstractEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  /** Storefront account password hash. `select: false` — never returned by default. */
  @Column({ type: 'varchar', nullable: true, select: false })
  password: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
