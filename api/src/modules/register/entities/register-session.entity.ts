import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type RegisterStatus = 'open' | 'closed';

/** A cash-drawer shift: opened with a float, closed by counting the drawer. */
@Entity('register_sessions')
export class RegisterSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: 'open' })
  status: RegisterStatus;

  /** The branch this drawer belongs to — a register is physical, per-branch. */
  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({ type: 'double precision', default: 0 })
  openingBalance: number;

  /** Physically counted cash at close. */
  @Column({ type: 'double precision', nullable: true })
  closingCountedBalance: number | null;

  /** What the drawer *should* hold at close (computed from cash transactions). */
  @Column({ type: 'double precision', nullable: true })
  expectedBalance: number | null;

  /** countedBalance − expectedBalance (over/short). */
  @Column({ type: 'double precision', nullable: true })
  variance: number | null;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @Column({ type: 'uuid', nullable: true })
  openedBy: string | null;

  @CreateDateColumn()
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;
}
