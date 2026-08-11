import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { Branch } from '@modules/branch/entities/branch.entity';
import { Supplier } from './supplier.entity';
import { PurchaseOrderLine } from './purchase-order-line.entity';

/**
 * Lifecycle of a purchase order:
 * - `draft`     — being built, editable.
 * - `ordered`   — sent to the supplier, awaiting delivery.
 * - `received`  — delivered; its lines have incremented stock (terminal).
 * - `cancelled` — abandoned (terminal).
 */
export type PurchaseOrderStatus =
  'draft' | 'ordered' | 'received' | 'cancelled';

/** A stock purchase from a supplier, delivered into one branch. */
@Index(['branchId', 'status'])
@Entity('purchase_orders')
export class PurchaseOrder extends AbstractEntity {
  /** Human reference, e.g. "PO-00042". */
  @Column({ type: 'varchar' })
  reference: string;

  @Column({ type: 'uuid', nullable: true })
  supplierId: string | null;

  @ManyToOne(() => Supplier, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @Column({ type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'varchar', default: 'draft' })
  status: PurchaseOrderStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'varchar', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  orderedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  receivedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @OneToMany(() => PurchaseOrderLine, (line) => line.purchaseOrder, {
    cascade: true,
  })
  lines: PurchaseOrderLine[];
}
