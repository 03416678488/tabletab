import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Category } from './category.entity';

/**
 * Per-language translation of a category's user-facing text. The base row
 * (`categories`) holds the source-language + non-translatable data (image, sort
 * order, active); this table carries `name`/`description` for each other
 * language. `locale` stores a language code (e.g. 'ar'). One row per
 * (category, language).
 */
@Index(['categoryId', 'locale'], { unique: true })
@Entity('category_translations')
export class CategoryTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  /** Language code, e.g. 'ar'. */
  @Column({ type: 'varchar' })
  locale: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
