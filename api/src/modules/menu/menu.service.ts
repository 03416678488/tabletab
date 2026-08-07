import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { FoodType } from '@modules/food-type/entities/food-type.entity';
import { Menu } from '@modules/menus/entities/menu.entity';
import { TenantRequest } from '@modules/tenancy/tenancy.types';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { menuChannel } from '@modules/realtime/channels';
import { SettingService } from '@modules/setting/setting.service';

import { MenuItem } from './entities/menu-item.entity';
import { MenuValidatorService } from './services/menu-validator.service';
import { MenuHelperService } from './services/menu.helper.service';
import { MenuSyncService } from './services/menu-sync.service';
import { MenuTranslationService } from './services/menu-translation.service';
import { CreateMenuItemDto, UpdateMenuItemDto, GetMenuItemQueryDto } from './dto';

const RELATIONS = ['category', 'foodTypes', 'menus'];

/** Main menu flow only — validation + normalization live in the sibling services. */
@Injectable()
export class MenuService extends AbstractService<MenuItem> {
  constructor(
    @InjectRepository(MenuItem)
    protected readonly repository: Repository<MenuItem>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: MenuValidatorService,
    private readonly _helper: MenuHelperService,
    private readonly _realtime: RealtimeService,
    private readonly _menuSync: MenuSyncService,
    private readonly _translations: MenuTranslationService,
    private readonly _settings: SettingService,
    @InjectDataSource() private readonly _defaultDataSource: DataSource,
    @Inject(REQUEST) private readonly _req: TenantRequest,
  ) {
    super(repository, pagination);
  }

  /**
   * Nudge the tenant's storefront/POS to reconcile the menu (availability, price,
   * add/remove). Public per-tenant channel — the menu isn't sensitive. Also
   * auto-pushes the menu out to connected aggregators (best-effort, no-op unless
   * a live endpoint is configured).
   */
  private emitMenuChanged(itemId: string): void {
    this._realtime.publish(menuChannel(this._req.tenant?.id), 'menu.changed', { id: itemId });
    // Debounced per-tenant DELTA push to connected aggregators (best-effort,
    // no-op unless a live endpoint is configured).
    this._menuSync.schedule(
      this._req.tenant?.id ?? 'default',
      this._req.tenantDataSource ?? this._defaultDataSource,
      itemId,
    );
  }

  async getAll(query: GetMenuItemQueryDto, lang?: string): Promise<Paginated<MenuItem>> {
    const where = this._helper.resolveListFilters(query);
    const page = await this.pagination.paginationQuery(query, this.repository, where, RELATIONS);
    await this._translations.overlay(page.items, lang);
    return page;
  }

  async getById(id: string, lang?: string): Promise<MenuItem> {
    const item = await this._validator.ensureExists(id);
    await this._translations.overlay([item], lang);
    return item;
  }

  /** The tenant's default (source) language — content in `menu_items` is in this. */
  private async baseLang(): Promise<string> {
    return (await this._settings.getGroup('site')).default_language || 'en';
  }

  /** True when writes for `lang` should target the translation table, not the base row. */
  private async isTranslated(lang?: string): Promise<boolean> {
    return !!lang && lang !== (await this.baseLang());
  }

  async createMenuItem(dto: CreateMenuItemDto, lang?: string): Promise<MenuItem> {
    await this._validator.validateCreate(dto);
    const entity = this.repository.create({
      ...this._helper.resolveCreatePayload(dto),
      foodTypes: this.toRefs<FoodType>(dto.foodTypeIds),
      menus: this.toRefs<Menu>(dto.menuIds),
    });
    const saved = await this.repository.save(entity);
    // In a non-default language, also record the typed text as that language's
    // translation (the base row keeps it as a fallback for other languages).
    if (await this.isTranslated(lang)) {
      await this._translations.saveForItem(saved.id, [
        { locale: lang!, name: dto.name, description: dto.description },
      ]);
    }
    this.emitMenuChanged(saved.id);
    return this.getById(saved.id, lang);
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto, lang?: string): Promise<MenuItem> {
    await this._validator.validateUpdate(id, dto);
    const translated = await this.isTranslated(lang);
    const item = await this.repository.findOne({
      where: { id },
      relations: ['foodTypes', 'menus'],
    });
    // In a non-default language, name/description go to the translation table;
    // the base row only takes the non-translatable fields.
    const baseDto = translated ? { ...dto, name: undefined, description: undefined } : dto;
    Object.assign(item, this._helper.resolveUpdatePayload(baseDto));
    if (dto.foodTypeIds !== undefined) item.foodTypes = this.toRefs<FoodType>(dto.foodTypeIds);
    if (dto.menuIds !== undefined) item.menus = this.toRefs<Menu>(dto.menuIds);
    await this.repository.save(item);
    if (translated && (dto.name !== undefined || dto.description !== undefined)) {
      await this._translations.saveForItem(id, [
        { locale: lang!, name: dto.name, description: dto.description },
      ]);
    }
    this.emitMenuChanged(id);
    return this.getById(id, lang);
  }

  async deleteMenuItem(id: string) {
    await this._validator.ensureExists(id);
    const result = await this.delete(id);
    this.emitMenuChanged(id);
    return result;
  }

  /** Turn an id list into partial relation refs TypeORM persists into the join table. */
  private toRefs<T>(ids?: string[]): T[] {
    return (ids ?? []).map((id) => ({ id }) as T);
  }
}
