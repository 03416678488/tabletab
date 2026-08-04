import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Generic content translation: one value for (entity, entityId, field, locale).
 * e.g. ('tax', '3', 'name', 'bn') → 'ভ্যাট'.
 */
@Index(['entity', 'entityId', 'field', 'locale'], { unique: true })
@Entity('translations')
export class Translation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  entity: string;

  @Column({ type: 'varchar' })
  entityId: string;

  @Column({ type: 'varchar' })
  field: string;

  @Column({ type: 'varchar' })
  locale: string;

  @Column({ type: 'text', nullable: true })
  value: string | null;
}
