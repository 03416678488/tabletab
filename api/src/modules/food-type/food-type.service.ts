import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { FoodType } from './entities/food-type.entity';
import { FoodTypeValidatorService } from './services/food-type-validator.service';
import { FoodTypeHelperService } from './services/food-type.helper.service';
import { CreateFoodTypeDto, UpdateFoodTypeDto, GetFoodTypeQueryDto } from './dto';

/** Main food-type flow only — validation + normalization live in the sibling services. */
@Injectable()
export class FoodTypeService extends AbstractService<FoodType> {
  constructor(
    @InjectRepository(FoodType)
    protected readonly repository: Repository<FoodType>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: FoodTypeValidatorService,
    private readonly _helper: FoodTypeHelperService,
  ) {
    super(repository, pagination);
  }

  getAll(query: GetFoodTypeQueryDto): Promise<Paginated<FoodType>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(query, this.repository, where, [], undefined, {
      sortOrder: 'ASC',
    });
  }

  getById(id: string): Promise<FoodType> {
    return this._validator.ensureExists(id);
  }

  async createFoodType(dto: CreateFoodTypeDto): Promise<FoodType> {
    await this._validator.validateCreate(dto);
    return this.create(this._helper.resolveCreatePayload(dto));
  }

  async updateFoodType(id: string, dto: UpdateFoodTypeDto): Promise<FoodType> {
    await this._validator.validateUpdate(id, dto);
    await this.repository.update(id, this._helper.resolveUpdatePayload(dto));
    return this.getById(id);
  }

  async deleteFoodType(id: string) {
    await this._validator.ensureExists(id);
    return this.delete(id);
  }
}
