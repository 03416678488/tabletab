import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { Table } from '@modules/table/entities/table.entity';
import { Branch } from '@modules/branch/entities/branch.entity';
import { Customer } from '@modules/customer/entities/customer.entity';
import { OrderItem } from './order-item.entity';

/** Where the order originated. */
export type OrderType = 'pos' | 'online' | 'table';

/** Whether the order has been paid. Online/POS-paid = paid on creation; dine-in
 *  and POS pay-later = unpaid until collected at completion. */
export type PaymentStatus = 'unpaid' | 'paid';

/** Lifecycle of an order. `preparing` is what surfaces a table's KOT badge. */
export type OrderStatus =
  // Prepay dine-in: created but NOT yet paid — held out of the kitchen/floor
  // until the payment gateway (or staff) confirms, then it becomes 'placed'.
  | 'pending_payment'
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out-for-delivery'
  | 'served'
  | 'delivered'
  | 'completed'
  | 'cancelled';

@Index(['orderNumber'], { unique: true })
@Entity('orders')
export class Order extends AbstractEntity {
  @Column({ type: 'varchar' })
  orderNumber: string;

  @Column({ type: 'varchar', default: 'pos' })
  orderType: OrderType;

  @Column({ type: 'varchar', default: 'placed' })
  status: OrderStatus;

  /** Why the order was cancelled — required when moving to `cancelled`. */
  @Column({ type: 'varchar', nullable: true })
  cancellationReason: string | null;

  /** Origin channel, e.g. "foodpanda" — null for in-house orders. */
  @Column({ type: 'varchar', nullable: true })
  source: string | null;

  /** The provider's own order id (for syncing status back out). */
  @Column({ type: 'varchar', nullable: true })
  externalRef: string | null;

  @Column({ type: 'uuid', nullable: true })
  tableId: string | null;

  @ManyToOne(() => Table, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tableId' })
  table: Table;

  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  /** Assigned kitchen staff — set when the order is placed (on-shift chef). */
  @Column({ type: 'uuid', nullable: true })
  assignedChefId: string | null;

  /** Assigned waiter — set when a dine-in/pickup order is ready. */
  @Column({ type: 'uuid', nullable: true })
  assignedWaiterId: string | null;

  /** Assigned delivery rider — set when a delivery order is ready. */
  @Column({ type: 'uuid', nullable: true })
  assignedRiderId: string | null;

  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'varchar', nullable: true })
  customerName: string | null;

  @Column({ type: 'varchar', nullable: true })
  customerPhone: string | null;

  @Column({ type: 'varchar', nullable: true })
  customerAddress: string | null;

  @Column({ type: 'double precision', nullable: true })
  customerLat: number | null;

  @Column({ type: 'double precision', nullable: true })
  customerLng: number | null;

  @Column({ type: 'varchar', nullable: true })
  paymentMethod: string | null;

  @Column({ type: 'varchar', default: 'unpaid' })
  paymentStatus: PaymentStatus;

  @Column({ type: 'varchar', nullable: true })
  notes: string | null;

  @Column({ type: 'double precision', default: 0 })
  subtotal: number;

  @Column({ type: 'double precision', default: 0 })
  tax: number;

  @Column({ type: 'double precision', default: 0 })
  discount: number;

  @Column({ type: 'double precision', default: 0 })
  deliveryFee: number;

  @Column({ type: 'double precision', default: 0 })
  total: number;

  /** The promotion applied to this order (server-validated), if any. */
  @Column({ type: 'uuid', nullable: true })
  promotionId: string | null;

  @Column({ type: 'varchar', nullable: true })
  promotionCode: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];
}
