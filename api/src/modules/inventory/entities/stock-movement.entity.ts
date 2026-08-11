import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StockItem } from './stock-item.entity';

/** Why stock moved — the audit reason on every ledger row. */
export type StockMovementType =
  | 'purchase'
  | 'sale'
  | 'waste'
  | 'adjustment'
  | 'restock'
  | 'transfer_in'
  | 'transfer_out';

/** Whether the movement added to or removed from on-hand stock. */
export type StockMovementDirection = 'in' | 'out';

/**
 * Append-only audit ledger of every stock change (mirrors the transactions
 * ledger pattern). `quantity` is always a positive magnitude; `direction` says
 * whether it was added or removed. Sale/restock rows carry the `orderId` they
 * came from so a confirm→deduct is idempotent and a cancel can be reversed.
 */
@Index(['stockItemId', 'branchId'])
@Index(['orderId'])
@Index(['createdAt'])
@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  stockItemId: string;

  @ManyToOne(() => StockItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stockItemId' })
  stockItem: StockItem;

  @Column({ type: 'uuid' })
  branchId: string;

  @Column({ type: 'varchar' })
  type: StockMovementType;

  @Column({ type: 'varchar' })
  direction: StockMovementDirection;

  /** Positive magnitude of the change, in the item's unit. */
  @Column({ type: 'numeric', precision: 12, scale: 3, default: 0 })
  quantity: number;

  /** Source order for sale/restock rows (null for manual moves). */
  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
