import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';

@Index(['branchId', 'name'], { unique: true })
@Entity('categories')
export class Category extends AbstractEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /** Owning branch — each branch has its own catalog. Null = legacy/global. */
  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;
}
