import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ShiftStatus = 'open' | 'closed';

/**
 * A staff member's on-duty period at a branch (clock-in → clock-out). Order and
 * waiter-call assignments are routed only to people currently on an open shift.
 */
@Index(['userId', 'status'])
@Entity('shifts')
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  /** Branch the staff member is on duty at (defaults to their home branch). */
  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({ type: 'varchar', default: 'open' })
  status: ShiftStatus;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @CreateDateColumn()
  clockInAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  clockOutAt: Date | null;
}
