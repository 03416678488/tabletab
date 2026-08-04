import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['name'], { unique: true })
@Entity('income_categories')
export class IncomeCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
