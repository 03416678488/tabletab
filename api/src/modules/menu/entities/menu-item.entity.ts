import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { Category } from '@modules/category/entities/category.entity';
import { FoodType } from '@modules/food-type/entities/food-type.entity';
import { Menu } from '@modules/menus/entities/menu.entity';

/** A named + priced option row (used for sizes, variants and add-ons). */
export interface MenuOptionRow {
  name: string;
  price: number;
}

/**
 * How this item draws down inventory when sold (hybrid model):
 * - `none`   — not stock-tracked (default; behaves as before).
 * - `recipe` — cooked dish; a sale deducts its recipe's raw ingredients.
 * - `unit`   — packaged good; the item *is* a stock item, a sale deducts 1 unit
 *              of {@link MenuItem.stockItemId}.
 */
export type ItemTrackingType = 'none' | 'recipe' | 'unit';

@Entity('menu_items')
export class MenuItem extends AbstractEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'double precision', default: 0 })
  price: number;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  images: string[];

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToMany(() => FoodType)
  @JoinTable({
    name: 'menu_item_food_types',
    joinColumn: { name: 'menuItemId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'foodTypeId', referencedColumnName: 'id' },
  })
  foodTypes: FoodType[];

  @ManyToMany(() => Menu)
  @JoinTable({
    name: 'menu_item_menus',
    joinColumn: { name: 'menuItemId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'menuId', referencedColumnName: 'id' },
  })
  menus: Menu[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  sizes: MenuOptionRow[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  variants: MenuOptionRow[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  addOns: MenuOptionRow[];

  /** Inventory tracking mode — see {@link ItemTrackingType}. */
  @Column({ type: 'varchar', default: 'none' })
  trackingType: ItemTrackingType;

  /** For `unit`-tracked items: the stock item this dish decrements directly. */
  @Column({ type: 'uuid', nullable: true })
  stockItemId: string | null;
}
