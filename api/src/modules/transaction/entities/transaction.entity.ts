import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from '@modules/order/entities/order.entity';
import { RegisterSession } from '@modules/register/entities/register-session.entity';

export type TransactionType =
  | 'sale'
  | 'refund'
  | 'cash_in'
  | 'cash_out'
  | 'reservation_deposit'
  | 'event_payment';
export type PaymentMethod = 'cash' | 'card' | 'mfs' | 'other';

@Index(['createdAt'])
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  type: TransactionType;

  @Column({ type: 'varchar', default: 'cash' })
  method: PaymentMethod;

  @Column({ type: 'double precision', default: 0 })
  amount: number;

  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  /**
   * Owning branch — set for earnings with no order link (reservation deposits,
   * event payments) so the dashboard can attribute them per branch. Order-linked
   * sales derive their branch from the order instead.
   */
  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({ type: 'uuid', nullable: true })
  registerSessionId: string | null;

  @ManyToOne(() => RegisterSession, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'registerSessionId' })
  registerSession: RegisterSession;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
