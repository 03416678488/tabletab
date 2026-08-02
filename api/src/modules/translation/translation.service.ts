import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Translation } from './entities/translation.entity';
import { SaveTranslationsDto } from './dto/translation.dto';

@Injectable()
export class TranslationService {
  constructor(
    @InjectRepository(Translation)
    private readonly _repo: Repository<Translation>,
  ) {}

  /** All translations for one record: { field: { locale: value } }. */
  async getFor(
    entity: string,
    entityId: string,
  ): Promise<Record<string, Record<string, string>>> {
    const rows = await this._repo.find({ where: { entity, entityId } });
    const out: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      out[r.field] ??= {};
      out[r.field][r.locale] = r.value ?? '';
    }
    return out;
  }

  /** Replace the translation set for one record. Empty values are removed. */
  async save(dto: SaveTranslationsDto): Promise<{ message: string }> {
    for (const item of dto.items) {
      const where = {
        entity: dto.entity,
        entityId: dto.entityId,
        field: item.field,
        locale: item.locale,
      };
      const existing = await this._repo.findOne({ where });
      const value = (item.value ?? '').trim();

      if (!value) {
        if (existing) await this._repo.delete(existing.id);
        continue;
      }
      if (existing) {
        existing.value = value;
        await this._repo.save(existing);
      } else {
        await this._repo.save(this._repo.create({ ...where, value }));
      }
    }
    return { message: 'Translations saved' };
  }
}
