import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { Table } from '@modules/table/entities/table.entity';

@Index(['slug'], { unique: true })
@Index(['tableId'], { unique: true })
@Entity('qr_codes')
export class QrCode extends AbstractEntity {
  /** Public token embedded in the scan URL, e.g. /t/{slug}. */
  @Column({ type: 'varchar' })
  slug: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid' })
  tableId: string;

  @ManyToOne(() => Table, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tableId' })
  table: Table;
}
