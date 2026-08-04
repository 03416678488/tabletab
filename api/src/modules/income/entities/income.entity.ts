import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IncomeCategory } from './income-category.entity';

@Entity('incomes')
export class Income {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'double precision', default: 0 })
  amount: number;

  @Column({ type: 'int', nullable: true })
  categoryId: number | null;

  @ManyToOne(() => IncomeCategory, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: IncomeCategory;

  @Column({ type: 'varchar', nullable: true })
  incomeFor: string | null;

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
