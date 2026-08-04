import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { MenuItem } from '@modules/menu/entities/menu-item.entity';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem extends AbstractEntity {
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'uuid', nullable: true })
  menuItemId: string | null;

  @ManyToOne(() => MenuItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItem;

  /** Snapshot of the item name/price at order time. */
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'double precision', default: 0 })
  unitPrice: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'double precision', default: 0 })
  lineTotal: number;

  @Column({ type: 'varchar', nullable: true })
  notes: string | null;
}
