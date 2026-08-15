import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { Branch } from '@modules/branch/entities/branch.entity';

// Areas are per-branch: each branch owns its own floor areas, so the name is
// unique within a branch rather than globally.
@Index(['branchId', 'name'], { unique: true })
@Entity('areas')
export class Area extends AbstractEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;
}
