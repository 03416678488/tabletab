import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Category } from '../entities/category.entity';
import { CategoryTranslation } from '../entities/category-translation.entity';

export interface CategoryTranslationEntry {
  locale: string;
  name?: string;
  description?: string;
}

/**
 * Category translations: read/write of per-language name/description, and the
 * read-time overlay that swaps a fetched category's text into the active
 * language (falling back to the base row when a field/language is missing).
 * Mirrors the menu-item translation service.
 */
@Injectable()
export class CategoryTranslationService {
  constructor(
    @InjectRepository(CategoryTranslation)
    private readonly _repo: Repository<CategoryTranslation>,
  ) {}

  /** Upsert a category's translations. Rows with no name AND no description are removed. */
  async saveForCategory(
    categoryId: string,
    entries: CategoryTranslationEntry[],
  ): Promise<void> {
    for (const entry of entries) {
      const locale = entry.locale.trim();
      if (!locale) continue;
      const name = entry.name?.trim() || null;
      const description = entry.description?.trim() || null;
      const existing = await this._repo.findOne({ where: { categoryId, locale } });

      if (!name && !description) {
        if (existing) await this._repo.delete(existing.id);
        continue;
      }
      if (existing) {
        existing.name = name;
        existing.description = description;
        await this._repo.save(existing);
      } else {
        await this._repo.save(this._repo.create({ categoryId, locale, name, description }));
      }
    }
  }

  /**
   * Overlay the active-language text onto a set of categories, in place. Batches
   * one query for all ids. No-op when `lang` is empty (base language as-is).
   */
  async overlay(categories: Category[], lang?: string | null): Promise<void> {
    const locale = lang?.trim();
    if (!locale || !categories.length) return;

    const ids = categories.map((c) => c.id);
    const rows = await this._repo.find({ where: { categoryId: In(ids), locale } });
    if (!rows.length) return;

    const byCategory = new Map(rows.map((r) => [r.categoryId, r]));
    for (const category of categories) {
      const tr = byCategory.get(category.id);
      if (!tr) continue;
      if (tr.name) category.name = tr.name;
      if (tr.description) category.description = tr.description;
    }
  }
}
