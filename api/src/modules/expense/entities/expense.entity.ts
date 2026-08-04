import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExpenseCategory } from './expense-category.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'double precision', default: 0 })
  amount: number;

  @Column({ type: 'int', nullable: true })
  categoryId: number | null;

  @ManyToOne(() => ExpenseCategory, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: ExpenseCategory;

  @Column({ type: 'varchar', nullable: true })
  expenseFor: string | null;

  @Column({ type: 'varchar', nullable: true })
  paymentType: string | null;

  @Column({ type: 'varchar', nullable: true })
  referenceNumber: string | null;

  @Column({ type: 'date', nullable: true })
  date: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
