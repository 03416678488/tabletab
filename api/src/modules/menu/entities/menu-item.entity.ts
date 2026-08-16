import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
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
 * A menu item is GLOBAL (one catalogue for the whole tenant — no `branchId`).
 * A branch "carries" an item by placing it into one of its per-branch
 * categories (or menus): the `categories` M2M below is the membership link, so
 * the same item can sit in different categories at different branches with zero
 * duplication.
 */
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

  /**
   * Per-branch category membership. Categories are per-branch, so this M2M is
   * how a global item is assigned to a branch's catalogue (and grouped within
   * it). Replaces the old single `categoryId` FK.
   */
  @ManyToMany(() => Category)
  @JoinTable({
    name: 'menu_item_categories',
    joinColumn: { name: 'menuItemId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' },
  })
  categories: Category[];

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
}
