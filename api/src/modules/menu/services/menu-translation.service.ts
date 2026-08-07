import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { MenuItem } from '../entities/menu-item.entity';
import { MenuItemTranslation } from '../entities/menu-item-translation.entity';
import { MenuItemTranslationEntryDto } from '../dto';

/**
 * Menu-item translations: admin read/write of per-language name/description, and
 * the read-time overlay that swaps a fetched item's text into the active
 * language (falling back to the base row when a field/language is missing).
 */
@Injectable()
export class MenuTranslationService {
  constructor(
    @InjectRepository(MenuItemTranslation)
    private readonly _repo: Repository<MenuItemTranslation>,
  ) {}

  /** Upsert an item's translations. Rows with no name AND no description are removed. */
  async saveForItem(
    menuItemId: string,
    entries: MenuItemTranslationEntryDto[],
  ): Promise<{ message: string }> {
    for (const entry of entries) {
      const locale = entry.locale.trim();
      if (!locale) continue;
      const name = entry.name?.trim() || null;
      const description = entry.description?.trim() || null;
      const existing = await this._repo.findOne({ where: { menuItemId, locale } });

      if (!name && !description) {
        if (existing) await this._repo.delete(existing.id);
        continue;
      }
      if (existing) {
        existing.name = name;
        existing.description = description;
        await this._repo.save(existing);
      } else {
        await this._repo.save(this._repo.create({ menuItemId, locale, name, description }));
      }
    }
    return { message: 'Translations saved' };
  }

  /**
   * Overlay the active-language text onto a set of items, in place. Batches one
   * query for all ids. No-op when `lang` is empty (base language served as-is).
   */
  async overlay(items: MenuItem[], lang?: string | null): Promise<void> {
    const locale = lang?.trim();
    if (!locale || !items.length) return;

    const ids = items.map((i) => i.id);
    const rows = await this._repo.find({ where: { menuItemId: In(ids), locale } });
    if (!rows.length) return;

    const byItem = new Map(rows.map((r) => [r.menuItemId, r]));
    for (const item of items) {
      const tr = byItem.get(item.id);
      if (!tr) continue;
      if (tr.name) item.name = tr.name;
      if (tr.description) item.description = tr.description;
    }
  }
}
