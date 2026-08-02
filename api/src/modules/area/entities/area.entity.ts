import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';

@Index(['name'], { unique: true })
@Entity('areas')
export class Area extends AbstractEntity {
  @Column({ type: 'varchar' })
  name: string;
}
