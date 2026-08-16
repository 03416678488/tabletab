import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { ErrorProvider } from '@modules/common/error/error.provider';
import { Category } from '@modules/category/entities/category.entity';
import { FoodType } from '@modules/food-type/entities/food-type.entity';
import { Menu } from '@modules/menus/entities/menu.entity';

import { MenuItem } from '../entities/menu-item.entity';
import { CreateMenuItemDto, UpdateMenuItemDto } from '../dto';

@Injectable()
export class MenuValidatorService extends AbstractService<MenuItem> {
  constructor(
    @InjectRepository(MenuItem)
    protected readonly repository: Repository<MenuItem>,
    @InjectRepository(Category)
    private readonly _categoryRepository: Repository<Category>,
    @InjectRepository(FoodType)
    private readonly _foodTypeRepository: Repository<FoodType>,
    @InjectRepository(Menu)
    private readonly _menuRepository: Repository<Menu>,
    private readonly _errors: ErrorProvider,
  ) {
    super(repository);
  }

  async validateCreate(dto: CreateMenuItemDto): Promise<void> {
    await this.validateRelations(dto);
  }

  async validateUpdate(id: string, dto: UpdateMenuItemDto): Promise<void> {
    await this.ensureExists(id);
    await this.validateRelations(dto);
  }

  private async validateRelations(
    dto: CreateMenuItemDto | UpdateMenuItemDto,
  ): Promise<void> {
    if (dto.categoryIds?.length)
      await this.ensureAllExist(
        this._categoryRepository,
        dto.categoryIds,
        'categoryIds',
        'category',
      );
    if (dto.foodTypeIds?.length)
      await this.ensureAllExist(
        this._foodTypeRepository,
        dto.foodTypeIds,
        'foodTypeIds',
        'food type',
      );
    if (dto.menuIds?.length)
      await this.ensureAllExist(
        this._menuRepository,
        dto.menuIds,
        'menuIds',
        'menu',
      );
  }

  /** Fetch a menu item with its relations or raise a 404. */
  async ensureExists(id: string): Promise<MenuItem> {
    const item = await this.repository.findOne({
      where: { id },
      relations: ['categories', 'foodTypes', 'menus'],
    });
    if (!item) {
      this._errors.add('menuItem', 'Menu item not found');
      this._errors.throwNotFoundErrorIfExists();
    }
    return item;
  }

  private async ensureAllExist(
    repo: Repository<{ id: string }>,
    ids: string[],
    field: string,
    label: string,
  ): Promise<void> {
    const found = await repo.count({ where: { id: In(ids) } });
    if (found !== new Set(ids).size) {
      this._errors.add(field, `One or more ${label}s were not found`);
      this._errors.throwNotFoundErrorIfExists();
    }
  }
}
