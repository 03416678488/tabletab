import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';

/**
 * Food types (Veg, Halal, Spicy…) are an intrinsic, GLOBAL attribute of a menu
 * item — one shared catalogue for the tenant, not per-branch. Linked to items
 * via the `menu_item_food_types` M2M.
 */
@Index(['name'], { unique: true })
@Entity('food_types')
export class FoodType extends AbstractEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
