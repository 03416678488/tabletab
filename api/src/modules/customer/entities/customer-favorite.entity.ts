import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';

/**
 * A storefront customer's saved menu item. One row per (customer, item); the
 * unique index enforces no duplicates. Lives in the tenant DB alongside the
 * customer + menu item it references.
 */
@Index(['customerId', 'menuItemId'], { unique: true })
@Entity('customer_favorites')
export class CustomerFavorite extends AbstractEntity {
  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'uuid' })
  menuItemId: string;
}
