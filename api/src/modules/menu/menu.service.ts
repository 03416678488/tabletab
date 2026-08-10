import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { FoodType } from '@modules/food-type/entities/food-type.entity';
import { Menu } from '@modules/menus/entities/menu.entity';
import { TenantRequest } from '@modules/tenancy/tenancy.types';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { menuChannel } from '@modules/realtime/channels';

import { MenuItem } from './entities/menu-item.entity';
import { MenuValidatorService } from './services/menu-validator.service';
import { MenuHelperService } from './services/menu.helper.service';
import { MenuSyncService } from './services/menu-sync.service';
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
  GetMenuItemQueryDto,
} from './dto';

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
    this._realtime.publish(menuChannel(this._req.tenant?.id), 'menu.changed', {
      id: itemId,
    });
    // Debounced per-tenant DELTA push to connected aggregators (best-effort,
    // no-op unless a live endpoint is configured).
    this._menuSync.schedule(
      this._req.tenant?.id ?? 'default',
      this._req.tenantDataSource ?? this._defaultDataSource,
      itemId,
    );
  }

  getAll(query: GetMenuItemQueryDto): Promise<Paginated<MenuItem>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(
      query,
      this.repository,
      where,
      RELATIONS,
    );
  }

  getById(id: string): Promise<MenuItem> {
    return this._validator.ensureExists(id);
  }

  async createMenuItem(dto: CreateMenuItemDto): Promise<MenuItem> {
    await this._validator.validateCreate(dto);
    const entity = this.repository.create({
      ...this._helper.resolveCreatePayload(dto),
      foodTypes: this.toRefs<FoodType>(dto.foodTypeIds),
      menus: this.toRefs<Menu>(dto.menuIds),
    });
    const saved = await this.repository.save(entity);
    this.emitMenuChanged(saved.id);
    return this.getById(saved.id);
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto): Promise<MenuItem> {
    await this._validator.validateUpdate(id, dto);
    const item = await this.repository.findOne({
      where: { id },
      relations: ['foodTypes', 'menus'],
    });
    Object.assign(item, this._helper.resolveUpdatePayload(dto));
    if (dto.foodTypeIds !== undefined)
      item.foodTypes = this.toRefs<FoodType>(dto.foodTypeIds);
    if (dto.menuIds !== undefined) item.menus = this.toRefs<Menu>(dto.menuIds);
    await this.repository.save(item);
    this.emitMenuChanged(id);
    return this.getById(id);
  }

  async deleteMenuItem(id: string) {
    await this._validator.ensureExists(id);
    const result = await this.delete(id);
    this.emitMenuChanged(id);
    return result;
  }

  /** Delete many items at once (one atomic statement). */
  async bulkDelete(ids: string[]): Promise<{ deleted: number }> {
    if (!ids.length) return { deleted: 0 };
    const res = await this.repository.delete({ id: In(ids) });
    this.emitMenuChanged(ids[0]);
    return { deleted: res.affected ?? 0 };
  }

  /** Mark many items available/unavailable at once (one atomic statement). */
  async bulkSetAvailability(
    ids: string[],
    isAvailable: boolean,
  ): Promise<{ updated: number }> {
    if (!ids.length) return { updated: 0 };
    const res = await this.repository.update({ id: In(ids) }, { isAvailable });
    this.emitMenuChanged(ids[0]);
    return { updated: res.affected ?? 0 };
  }

  /** Move many items to a category at once (one atomic statement). */
  async bulkSetCategory(
    ids: string[],
    categoryId: string,
  ): Promise<{ updated: number }> {
    if (!ids.length) return { updated: 0 };
    const res = await this.repository.update({ id: In(ids) }, { categoryId });
    this.emitMenuChanged(ids[0]);
    return { updated: res.affected ?? 0 };
  }

  /** Turn an id list into partial relation refs TypeORM persists into the join table. */
  private toRefs<T>(ids?: string[]): T[] {
    return (ids ?? []).map((id) => ({ id }) as T);
  }
}
