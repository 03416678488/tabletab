import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { StockItem } from '@modules/inventory/entities/stock-item.entity';
import { PurchaseOrder } from './purchase-order.entity';

/** One line of a purchase order: quantity of a stock item at a unit cost. */
@Index(['purchaseOrderId'])
@Entity('purchase_order_lines')
export class PurchaseOrderLine extends AbstractEntity {
  @Column({ type: 'uuid' })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder;

  @Column({ type: 'uuid' })
  stockItemId: string;

  @ManyToOne(() => StockItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stockItemId' })
  stockItem: StockItem;

  @Column({ type: 'numeric', precision: 12, scale: 3, default: 0 })
  quantity: number;

  @Column({ type: 'numeric', precision: 12, scale: 3, default: 0 })
  unitCost: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  lineTotal: number;
}
