import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { StockItem } from './stock-item.entity';
import { StockTake } from './stock-take.entity';

/**
 * One counted line of a stock take: the on-hand quantity the system believed at
 * snapshot time (`systemQty`) versus what was physically counted (`countedQty`).
 * The difference is reconciled into stock when the take is completed.
 */
@Index(['stockTakeId'])
@Entity('stock_take_lines')
export class StockTakeLine extends AbstractEntity {
  @Column({ type: 'uuid' })
  stockTakeId: string;

  @ManyToOne(() => StockTake, (take) => take.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stockTakeId' })
  stockTake: StockTake;

  @Column({ type: 'uuid' })
  stockItemId: string;

  @ManyToOne(() => StockItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stockItemId' })
  stockItem: StockItem;

  /** On-hand quantity captured when the take was opened. */
  @Column({ type: 'numeric', precision: 12, scale: 3, default: 0 })
  systemQty: number;

  /** Quantity physically counted. */
  @Column({ type: 'numeric', precision: 12, scale: 3, default: 0 })
  countedQty: number;
}
