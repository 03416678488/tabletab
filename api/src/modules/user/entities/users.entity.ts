import { Column, Entity, Index, OneToMany } from 'typeorm';
import { UserRolePermissions } from '@modules/role/entities/user-role-permissions.entity';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { Expose } from 'class-transformer';
import { CodeAttemptLog } from './code-attempt-log.entity';

@Index(['email'], { unique: true })
@Entity('users')
export class User extends AbstractEntity {
  @Column({ type: 'varchar', nullable: true })
  firstName: string;

  @Column({ type: 'varchar', nullable: true })
  lastName: string;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  password: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', unique: true })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  resetToken: string;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiry: Date;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  verificationToken: string;

  @Column({ type: 'timestamp', nullable: true })
  verificationTokenExpiry: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /** Home branch. NULL = not scoped to a branch (sees all branches' events). */
  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'int', default: 0 })
  resetCodeAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  resetCodeLastAttemptAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resetCodeLockedUntil: Date;

  @Column({ type: 'varchar', length: 50, nullable: true, default: 'email' })
  resetCodeDeliveredVia: string;

  @Column({ type: 'timestamp', nullable: true })
  resetCodeSentAt: Date;

  @Column({ type: 'int', default: 0 })
  verificationCodeAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  verificationCodeLastAttemptAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  verificationCodeLockedUntil: Date;

  @Column({ type: 'varchar', length: 50, nullable: true, default: 'email' })
  verificationCodeDeliveredVia: string;

  @Column({ type: 'timestamp', nullable: true })
  verificationCodeSentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  passwordChangedAt: Date;

  @OneToMany(() => CodeAttemptLog, (log) => log.user)
  codeAttemptLogs: CodeAttemptLog[];

  @OneToMany(() => UserRolePermissions, (userRolePermissions) => userRolePermissions.user)
  userRolePermissions: UserRolePermissions[];

  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
