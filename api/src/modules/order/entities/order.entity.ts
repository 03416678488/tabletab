import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { Table } from '@modules/table/entities/table.entity';
import { Branch } from '@modules/branch/entities/branch.entity';
import { Customer } from '@modules/customer/entities/customer.entity';
import { OrderItem } from './order-item.entity';

/** Where the order originated. */
export type OrderType = 'pos' | 'online' | 'table';

/** Lifecycle of an order. `preparing` is what surfaces a table's KOT badge. */
export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
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

  @Column({ type: 'varchar', nullable: true })
  notes: string | null;

  @Column({ type: 'double precision', default: 0 })
  subtotal: number;

  @Column({ type: 'double precision', default: 0 })
  tax: number;

  @Column({ type: 'double precision', default: 0 })
  discount: number;

  @Column({ type: 'double precision', default: 0 })
  total: number;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];
}
