import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { Category } from '@modules/category/entities/category.entity';
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

const RELATIONS = ['categories', 'foodTypes', 'menus'];

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

  async getAll(query: GetMenuItemQueryDto): Promise<Paginated<MenuItem>> {
    const branchId = query.branchId;
    if (!branchId) {
      const where = this._helper.resolveListFilters(query);
      return this.pagination.paginationQuery(
        query,
        this.repository,
        where,
        RELATIONS,
      );
    }

    // Branch-scoped: fold the per-branch availability overlay into both the
    // filter (so paginated `isAvailable` counts are exact) and the returned
    // values (so every consumer reads the effective per-branch availability).
    const overrides: Array<{ menuItemId: string; isAvailable: boolean }> =
      await this.repository.manager.query(
        `SELECT "menuItemId", "isAvailable" FROM "menu_item_branch_availability" WHERE "branchId" = $1`,
        [branchId],
      );
    const onIds = overrides
      .filter((o) => o.isAvailable)
      .map((o) => o.menuItemId);
    const offIds = overrides
      .filter((o) => !o.isAvailable)
      .map((o) => o.menuItemId);

    const base = this._helper.resolveListFilters(query, {
      skipAvailability: true,
    });
    const where =
      query.isAvailable === undefined
        ? base
        : this._helper.branchAvailabilityWhere(
            base,
            query.isAvailable === 'true',
            onIds,
            offIds,
          );

    const result = await this.pagination.paginationQuery(
      query,
      this.repository,
      where,
      RELATIONS,
    );

    const onSet = new Set(onIds);
    const offSet = new Set(offIds);
    for (const it of result.items) {
      if (onSet.has(it.id)) it.isAvailable = true;
      else if (offSet.has(it.id)) it.isAvailable = false;
    }
    return result;
  }

  /** Effective availability per branch for one item (override ?? global). */
  getBranchAvailability(
    id: string,
  ): Promise<Array<{ branchId: string; isAvailable: boolean }>> {
    return this.repository.manager.query(
      `SELECT b.id AS "branchId",
              COALESCE(av."isAvailable", mi."isAvailable") AS "isAvailable"
       FROM branches b
       CROSS JOIN menu_items mi
       LEFT JOIN menu_item_branch_availability av
         ON av."menuItemId" = mi.id AND av."branchId" = b.id
       WHERE mi.id = $1
       ORDER BY b.name`,
      [id],
    );
  }

  getById(id: string): Promise<MenuItem> {
    return this._validator.ensureExists(id);
  }

  async createMenuItem(dto: CreateMenuItemDto): Promise<MenuItem> {
    await this._validator.validateCreate(dto);
    const entity = this.repository.create({
      ...this._helper.resolveCreatePayload(dto),
      categories: this.toRefs<Category>(dto.categoryIds),
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
      relations: ['categories', 'foodTypes', 'menus'],
    });
    Object.assign(item, this._helper.resolveUpdatePayload(dto));
    if (dto.categoryIds !== undefined)
      item.categories = this.toRefs<Category>(dto.categoryIds);
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

  /**
   * Mark many items available/unavailable. With `branchId` this writes a
   * per-branch override into the sparse overlay (86 an item at one branch);
   * without it, it flips the item's global master flag (every branch that has
   * no override).
   */
  async bulkSetAvailability(
    ids: string[],
    isAvailable: boolean,
    branchId?: string,
  ): Promise<{ updated: number }> {
    if (!ids.length) return { updated: 0 };
    if (branchId) {
      // Keep the overlay sparse: an override that matches the item's global flag
      // is redundant, so drop it; only store genuine deviations.
      await this.repository.manager.query(
        `DELETE FROM "menu_item_branch_availability" av
         USING "menu_items" mi
         WHERE av."menuItemId" = mi.id
           AND av."branchId" = $1::uuid
           AND av."menuItemId" = ANY($3::uuid[])
           AND mi."isAvailable" = $2::boolean`,
        [branchId, isAvailable, ids],
      );
      await this.repository.manager.query(
        `INSERT INTO "menu_item_branch_availability" ("menuItemId","branchId","isAvailable")
         SELECT mi.id, $1::uuid, $2::boolean
         FROM "menu_items" mi
         WHERE mi.id = ANY($3::uuid[]) AND mi."isAvailable" <> $2::boolean
         ON CONFLICT ("menuItemId","branchId")
         DO UPDATE SET "isAvailable" = EXCLUDED."isAvailable"`,
        [branchId, isAvailable, ids],
      );
      this.emitMenuChanged(ids[0]);
      return { updated: ids.length };
    }
    const res = await this.repository.update({ id: In(ids) }, { isAvailable });
    this.emitMenuChanged(ids[0]);
    return { updated: res.affected ?? 0 };
  }

  /** Add many items to a (per-branch) category — assigns the membership. */
  async bulkSetCategory(
    ids: string[],
    categoryId: string,
  ): Promise<{ updated: number }> {
    if (!ids.length) return { updated: 0 };
    // Adding an already-present membership throws — only link the ones missing it.
    const links = await this.newCategoryLinks(ids, categoryId);
    if (links.length) {
      await this.repository
        .createQueryBuilder()
        .relation(MenuItem, 'categories')
        .of(links)
        .add(categoryId);
    }
    this.emitMenuChanged(ids[0]);
    return { updated: links.length };
  }

  /** Items from `ids` that aren't already in `categoryId` (avoid duplicate-link). */
  private async newCategoryLinks(
    ids: string[],
    categoryId: string,
  ): Promise<string[]> {
    const existing = await this.repository
      .createQueryBuilder('mi')
      .innerJoin('mi.categories', 'c', 'c.id = :categoryId', { categoryId })
      .where('mi.id IN (:...ids)', { ids })
      .select('mi.id', 'id')
      .getRawMany<{ id: string }>();
    const has = new Set(existing.map((r) => r.id));
    return ids.filter((id) => !has.has(id));
  }

  /** Turn an id list into partial relation refs TypeORM persists into the join table. */
  private toRefs<T>(ids?: string[]): T[] {
    return (ids ?? []).map((id) => ({ id }) as T);
  }
}
