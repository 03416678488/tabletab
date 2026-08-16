import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parse } from 'csv-parse/sync';

import { Category } from '@modules/category/entities/category.entity';

import { MenuItem } from '../entities/menu-item.entity';

/** CSV columns for item import/export (v1 = core fields). */
const HEADERS = [
  'id',
  'name',
  'description',
  'price',
  'category',
  'available',
] as const;

export interface ImportResult {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

/** Escape a value for a CSV cell. */
function cell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Parse a spreadsheet truthy string; blank defaults to available. */
function parseAvailable(v: string | undefined): boolean {
  const s = (v ?? '').trim().toLowerCase();
  if (s === '') return true;
  return !/^(n|no|false|0|unavailable)$/.test(s);
}

/**
 * Item import/export. CSV format, core fields, upsert by id: a row with an `id`
 * updates that item; a blank `id` creates a new one. Kept separate from
 * MenuService per the module's controller/service/helper split.
 */
@Injectable()
export class MenuIoService {
  constructor(
    @InjectRepository(MenuItem) private readonly _items: Repository<MenuItem>,
    @InjectRepository(Category)
    private readonly _categories: Repository<Category>,
  ) {}

  /** Structured menu snapshot for pushing to an external catalog (e.g. foodpanda). */
  async snapshot(): Promise<{
    categories: { name: string }[];
    items: {
      name: string;
      description: string | null;
      price: number;
      category: string | null;
      available: boolean;
    }[];
  }> {
    const items = await this._items.find({
      relations: ['categories'],
      order: { name: 'ASC' },
    });
    const categoryNames = new Set<string>();
    const mapped = items.map((it) => {
      const category = it.categories?.[0]?.name ?? null;
      if (category) categoryNames.add(category);
      return {
        name: it.name,
        description: it.description ?? null,
        price: it.price,
        category,
        available: it.isAvailable,
      };
    });
    return {
      categories: [...categoryNames].map((name) => ({ name })),
      items: mapped,
    };
  }

  async exportCsv(): Promise<{ csv: string; count: number }> {
    const items = await this._items.find({
      relations: ['categories'],
      order: { name: 'ASC' },
    });
    const lines = [HEADERS.join(',')];
    for (const it of items) {
      lines.push(
        [
          it.id,
          it.name,
          it.description ?? '',
          it.price,
          it.categories?.[0]?.name ?? '',
          it.isAvailable ? 'yes' : 'no',
        ]
          .map(cell)
          .join(','),
      );
    }
    return { csv: lines.join('\n'), count: items.length };
  }

  async importCsv(csv: string): Promise<ImportResult> {
    let rows: Record<string, string>[];
    try {
      rows = parse(csv, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
    } catch (err) {
      throw new BadRequestException(
        `Could not parse CSV: ${(err as Error).message}`,
      );
    }

    // Resolve category names once (case-insensitive).
    const categories = await this._categories.find();
    const categoryByName = new Map(
      categories.map((c) => [c.name.toLowerCase(), c.id]),
    );

    const result: ImportResult = { created: 0, updated: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const line = i + 2; // account for the header row

      const name = (row.name ?? '').trim();
      if (!name) {
        result.errors.push({ row: line, message: 'Missing name' });
        continue;
      }

      const priceRaw = (row.price ?? '').trim();
      const price = Number(priceRaw);
      if (priceRaw === '' || Number.isNaN(price) || price < 0) {
        result.errors.push({
          row: line,
          message: `Invalid price "${priceRaw}"`,
        });
        continue;
      }

      let categoryId: string | null = null;
      const categoryName = (row.category ?? '').trim();
      if (categoryName) {
        const found = categoryByName.get(categoryName.toLowerCase());
        if (!found) {
          result.errors.push({
            row: line,
            message: `Category "${categoryName}" not found`,
          });
          continue;
        }
        categoryId = found;
      }

      const description = (row.description ?? '').trim();
      const isAvailable = parseAvailable(row.available);
      const id = (row.id ?? '').trim();

      try {
        if (id) {
          const existing = await this._items.findOne({
            where: { id },
            relations: ['categories'],
          });
          if (!existing) {
            result.errors.push({
              row: line,
              message: `Item id ${id} not found`,
            });
            continue;
          }
          existing.name = name;
          existing.description = description;
          existing.price = price;
          existing.categories = categoryId
            ? [{ id: categoryId } as Category]
            : [];
          existing.isAvailable = isAvailable;
          await this._items.save(existing);
          result.updated++;
        } else {
          const created = this._items.create({
            name,
            description,
            price,
            categories: categoryId ? [{ id: categoryId } as Category] : [],
            isAvailable,
            images: [],
            sizes: [],
            variants: [],
            addOns: [],
          });
          await this._items.save(created);
          result.created++;
        }
      } catch (err) {
        result.errors.push({ row: line, message: (err as Error).message });
      }
    }

    return result;
  }
}
