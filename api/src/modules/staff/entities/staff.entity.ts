import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { Branch } from '@modules/branch/entities/branch.entity';
import { StaffRoleEnum } from '../enums/staff-role.enum';

@Index(['email'], { unique: true })
@Entity('staff')
export class Staff extends AbstractEntity {
  @Column({ type: 'varchar' })
  firstName: string;

  @Column({ type: 'varchar' })
  lastName: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', default: StaffRoleEnum.WAITER })
  role: StaffRoleEnum;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;
}
