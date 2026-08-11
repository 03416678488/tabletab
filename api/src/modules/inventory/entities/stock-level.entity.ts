import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { Branch } from '@modules/branch/entities/branch.entity';
import { StockItem } from './stock-item.entity';

/**
 * The current on-hand quantity of one {@link StockItem} at one branch. Each
 * branch keeps its own pool (multi-tenant → per-branch stock); movements adjust
 * `quantity`, which is allowed to go negative (sell-through with an alert).
 */
@Unique('UQ_stock_levels_item_branch', ['stockItemId', 'branchId'])
@Index(['branchId'])
@Entity('stock_levels')
export class StockLevel extends AbstractEntity {
  @Column({ type: 'uuid' })
  stockItemId: string;

  @ManyToOne(() => StockItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stockItemId' })
  stockItem: StockItem;

  @Column({ type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'numeric', precision: 12, scale: 3, default: 0 })
  quantity: number;
}
