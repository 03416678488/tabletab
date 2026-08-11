import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';

/** Unit a stock item is measured/counted in. */
export type StockUnit = 'kg' | 'g' | 'l' | 'ml' | 'pcs';

/**
 * A raw ingredient or countable good in the inventory catalogue. Quantities are
 * held per-branch in {@link StockLevel}; this row is just the catalogue entry
 * (name, unit, cost, default reorder threshold).
 */
@Index(['name'])
@Entity('stock_items')
export class StockItem extends AbstractEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', default: 'pcs' })
  unit: StockUnit;

  /** Purchase cost per single {@link unit} — drives COGS/valuation reports. */
  @Column({ type: 'numeric', precision: 12, scale: 3, default: 0 })
  costPerUnit: number;

  /** Default low-stock threshold; a per-branch level at/below this alerts. */
  @Column({ type: 'numeric', precision: 12, scale: 3, default: 0 })
  reorderLevel: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
