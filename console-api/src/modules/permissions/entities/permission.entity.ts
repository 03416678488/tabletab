import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRolePermissions } from '@modules/role/entities/user-role-permissions.entity';
import { PermissionsEnum } from '../enums/permissions.enum';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  resource: string;

  @Column({ type: 'json', default: () => "'[]'" })
  actions: PermissionsEnum[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @OneToMany(() => UserRolePermissions, (userRolePermissions) => userRolePermissions.permission)
  userRolePermissions: UserRolePermissions[];
}
