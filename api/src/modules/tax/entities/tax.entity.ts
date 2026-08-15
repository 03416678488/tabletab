import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Branch } from '@modules/branch/entities/branch.entity';

// Taxes are per-branch: each branch owns its own VAT list, so the code is
// unique within a branch rather than globally.
@Index(['branchId', 'code'], { unique: true })
@Entity('taxes')
export class Tax {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'double precision', default: 0 })
  rate: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch | null;
}
