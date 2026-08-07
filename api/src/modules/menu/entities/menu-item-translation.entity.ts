import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { MenuItem } from './menu-item.entity';

/**
 * Per-language translation of a menu item's user-facing text. The base row
 * (`menu_items`) holds the source-language + non-translatable data (price,
 * images, availability); this table carries `name`/`description` for each other
 * language. `locale` stores a language code (e.g. 'ar', 'de'). One row per
 * (item, language).
 */
@Index(['menuItemId', 'locale'], { unique: true })
@Entity('menu_item_translations')
export class MenuItemTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  menuItemId: string;

  @ManyToOne(() => MenuItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItem;

  /** Language code, e.g. 'ar'. */
  @Column({ type: 'varchar' })
  locale: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
