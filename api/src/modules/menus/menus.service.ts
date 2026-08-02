import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { Menu } from './entities/menu.entity';
import { MenusValidatorService } from './services/menus-validator.service';
import { MenusHelperService } from './services/menus.helper.service';
import { CreateMenuDto, UpdateMenuDto, GetMenuQueryDto } from './dto';

/** Main menu flow only — validation + normalization live in the sibling services. */
@Injectable()
export class MenusService extends AbstractService<Menu> {
  constructor(
    @InjectRepository(Menu)
    protected readonly repository: Repository<Menu>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: MenusValidatorService,
    private readonly _helper: MenusHelperService,
  ) {
    super(repository, pagination);
  }

  getAll(query: GetMenuQueryDto): Promise<Paginated<Menu>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(query, this.repository, where, [], undefined, {
      sortOrder: 'ASC',
    });
  }

  getById(id: string): Promise<Menu> {
    return this._validator.ensureExists(id);
  }

  async createMenu(dto: CreateMenuDto): Promise<Menu> {
    await this._validator.validateCreate(dto);
    return this.create(this._helper.resolveCreatePayload(dto));
  }

  async updateMenu(id: string, dto: UpdateMenuDto): Promise<Menu> {
    await this._validator.validateUpdate(id, dto);
    await this.repository.update(id, this._helper.resolveUpdatePayload(dto));
    return this.getById(id);
  }

  async deleteMenu(id: string) {
    await this._validator.ensureExists(id);
    return this.delete(id);
  }
}
