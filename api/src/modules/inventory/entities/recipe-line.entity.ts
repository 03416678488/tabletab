import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { MenuItem } from '@modules/menu/entities/menu-item.entity';
import { StockItem } from './stock-item.entity';

/**
 * One ingredient line of a recipe-tracked menu item: "this dish consumes
 * `quantity` of `stockItem` per unit sold". The full recipe is every line for a
 * given `menuItemId`; a confirmed sale expands these into stock movements.
 */
@Unique('UQ_recipe_lines_item_stock', ['menuItemId', 'stockItemId'])
@Index(['menuItemId'])
@Index(['stockItemId'])
@Entity('recipe_lines')
export class RecipeLine extends AbstractEntity {
  @Column({ type: 'uuid' })
  menuItemId: string;

  @ManyToOne(() => MenuItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItem;

  @Column({ type: 'uuid' })
  stockItemId: string;

  @ManyToOne(() => StockItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stockItemId' })
  stockItem: StockItem;

  /** Amount of the stock item consumed per single unit of the menu item. */
  @Column({ type: 'numeric', precision: 12, scale: 3, default: 0 })
  quantity: number;
}
