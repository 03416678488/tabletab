import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '@modules/role/entities/role.entity';
import { PermissionsEnum } from '@modules/permissions/enums/permissions.enum';

/**
 * Role-scoped grant: for one role + one module (`resource`), the set of allowed
 * actions. Users inherit their role's grants. One row per (roleId, resource).
 */
@Index(['roleId', 'resource'], { unique: true })
@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  roleId: number;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ type: 'varchar' })
  resource: string;

  @Column({ type: 'json', default: () => "'[]'" })
  actions: PermissionsEnum[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;
}
