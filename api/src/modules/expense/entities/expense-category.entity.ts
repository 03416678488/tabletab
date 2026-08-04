import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['name'], { unique: true })
@Entity('expense_categories')
export class ExpenseCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
