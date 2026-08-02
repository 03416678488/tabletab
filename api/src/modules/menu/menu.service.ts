import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { FoodType } from '@modules/food-type/entities/food-type.entity';
import { Menu } from '@modules/menus/entities/menu.entity';

import { MenuItem } from './entities/menu-item.entity';
import { MenuValidatorService } from './services/menu-validator.service';
import { MenuHelperService } from './services/menu.helper.service';
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
  ) {
    super(repository, pagination);
  }

  getAll(query: GetMenuItemQueryDto): Promise<Paginated<MenuItem>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(query, this.repository, where, RELATIONS);
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
    return this.getById(saved.id);
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto): Promise<MenuItem> {
    await this._validator.validateUpdate(id, dto);
    const item = await this.repository.findOne({
      where: { id },
      relations: ['foodTypes', 'menus'],
    });
    Object.assign(item, this._helper.resolveUpdatePayload(dto));
    if (dto.foodTypeIds !== undefined) item.foodTypes = this.toRefs<FoodType>(dto.foodTypeIds);
    if (dto.menuIds !== undefined) item.menus = this.toRefs<Menu>(dto.menuIds);
    await this.repository.save(item);
    return this.getById(id);
  }

  async deleteMenuItem(id: string) {
    await this._validator.ensureExists(id);
    return this.delete(id);
  }

  /** Turn an id list into partial relation refs TypeORM persists into the join table. */
  private toRefs<T>(ids?: string[]): T[] {
    return (ids ?? []).map((id) => ({ id }) as T);
  }
}
