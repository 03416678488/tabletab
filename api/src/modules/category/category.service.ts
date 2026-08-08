import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { Category } from './entities/category.entity';
import { CategoryValidatorService } from './services/category-validator.service';
import { CategoryHelperService } from './services/category.helper.service';
import { CategoryTranslationService } from './services/category-translation.service';
import { CreateCategoryDto, UpdateCategoryDto, GetCategoryQueryDto } from './dto';
import { SettingService } from '@modules/setting/setting.service';

/** Main category flow only — validation + normalization live in the sibling services. */
@Injectable()
export class CategoryService extends AbstractService<Category> {
  constructor(
    @InjectRepository(Category)
    protected readonly repository: Repository<Category>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: CategoryValidatorService,
    private readonly _helper: CategoryHelperService,
    private readonly _translations: CategoryTranslationService,
    private readonly _settings: SettingService,
  ) {
    super(repository, pagination);
  }

  /** The tenant's default (source) language — content in `categories` is in this. */
  private async baseLang(): Promise<string> {
    return (await this._settings.getGroup('site')).default_language || 'en';
  }

  /** True when writes for `lang` should target the translation table, not the base row. */
  private async isTranslated(lang?: string): Promise<boolean> {
    return !!lang && lang !== (await this.baseLang());
  }

  async getAll(query: GetCategoryQueryDto, lang?: string): Promise<Paginated<Category>> {
    const where = this._helper.resolveListFilters(query);
    const page = await this.pagination.paginationQuery(query, this.repository, where, [], undefined, {
      sortOrder: 'ASC',
    });
    await this._translations.overlay(page.items, lang);
    return page;
  }

  async getById(id: string, lang?: string): Promise<Category> {
    const category = await this._validator.ensureExists(id);
    await this._translations.overlay([category], lang);
    return category;
  }

  async createCategory(dto: CreateCategoryDto, lang?: string): Promise<Category> {
    await this._validator.validateCreate(dto);
    const saved = await this.create(this._helper.resolveCreatePayload(dto));
    // In a non-default language, also record the typed text as that language's
    // translation (the base row keeps it as a fallback for other languages).
    if (await this.isTranslated(lang)) {
      await this._translations.saveForCategory(saved.id, [
        { locale: lang!, name: dto.name, description: dto.description },
      ]);
    }
    return this.getById(saved.id, lang);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, lang?: string): Promise<Category> {
    await this._validator.validateUpdate(id, dto);
    const translated = await this.isTranslated(lang);
    // In a non-default language, name/description go to the translation table;
    // the base row only takes the non-translatable fields.
    const baseDto = translated ? { ...dto, name: undefined, description: undefined } : dto;
    await this.repository.update(id, this._helper.resolveUpdatePayload(baseDto));
    if (translated && (dto.name !== undefined || dto.description !== undefined)) {
      await this._translations.saveForCategory(id, [
        { locale: lang!, name: dto.name, description: dto.description },
      ]);
    }
    return this.getById(id, lang);
  }

  async deleteCategory(id: string) {
    await this._validator.ensureExists(id);
    return this.delete(id);
  }
}
