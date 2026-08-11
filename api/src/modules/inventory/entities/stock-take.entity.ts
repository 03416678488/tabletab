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
import { StockTakeLine } from './stock-take-line.entity';

/**
 * A physical stock count at a branch:
 * - `draft`     — counting in progress; lines editable.
 * - `completed` — variances reconciled into stock via adjustment movements (terminal).
 * - `cancelled` — abandoned, no stock effect (terminal).
 */
export type StockTakeStatus = 'draft' | 'completed' | 'cancelled';

@Index(['branchId', 'status'])
@Entity('stock_takes')
export class StockTake extends AbstractEntity {
  /** Human reference, e.g. "ST-00007". */
  @Column({ type: 'varchar' })
  reference: string;

  @Column({ type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'varchar', default: 'draft' })
  status: StockTakeStatus;

  @Column({ type: 'varchar', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @OneToMany(() => StockTakeLine, (line) => line.stockTake, { cascade: true })
  lines: StockTakeLine[];
}
