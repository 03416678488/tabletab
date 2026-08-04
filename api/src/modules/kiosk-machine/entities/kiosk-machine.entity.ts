import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Branch } from '@modules/branch/entities/branch.entity';

@Index(['machineId'], { unique: true })
@Entity('kiosk_machines')
export class KioskMachine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  machineId: string;

  @Column({ type: 'varchar', nullable: true })
  userName: string | null;

  @Column({ type: 'varchar' })
  username: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;
}
