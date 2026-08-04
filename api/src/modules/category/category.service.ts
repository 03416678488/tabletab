import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { Category } from './entities/category.entity';
import { CategoryValidatorService } from './services/category-validator.service';
import { CategoryHelperService } from './services/category.helper.service';
import { CreateCategoryDto, UpdateCategoryDto, GetCategoryQueryDto } from './dto';

/** Main category flow only — validation + normalization live in the sibling services. */
@Injectable()
export class CategoryService extends AbstractService<Category> {
  constructor(
    @InjectRepository(Category)
    protected readonly repository: Repository<Category>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: CategoryValidatorService,
    private readonly _helper: CategoryHelperService,
  ) {
    super(repository, pagination);
  }

  getAll(query: GetCategoryQueryDto): Promise<Paginated<Category>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(query, this.repository, where, [], undefined, {
      sortOrder: 'ASC',
    });
  }

  getById(id: string): Promise<Category> {
    return this._validator.ensureExists(id);
  }

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    await this._validator.validateCreate(dto);
    return this.create(this._helper.resolveCreatePayload(dto));
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this._validator.validateUpdate(id, dto);
    await this.repository.update(id, this._helper.resolveUpdatePayload(dto));
    return this.getById(id);
  }

  async deleteCategory(id: string) {
    await this._validator.ensureExists(id);
    return this.delete(id);
  }
}
