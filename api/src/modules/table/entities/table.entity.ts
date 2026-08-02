import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { Branch } from '@modules/branch/entities/branch.entity';
import { Area } from '@modules/area/entities/area.entity';

@Index(['branchId', 'name'], { unique: true })
@Entity('tables')
export class Table extends AbstractEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'uuid', nullable: true })
  areaId: string | null;

  @ManyToOne(() => Area, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'areaId' })
  area: Area;

  @Column({ type: 'int', default: 2 })
  capacity: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;
}
