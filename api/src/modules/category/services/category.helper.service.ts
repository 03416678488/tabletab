import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';

import { trimSpaces } from '@cor/helpers';

import { Category } from '../entities/category.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  GetCategoryQueryDto,
} from '../dto';
import { toILikeContains } from '@cor/helpers/query.helper';

/**
 * Pure resolver helpers for the category module — normalization, defaults and
 * query building. Keeps CategoryService focused on orchestration only.
 */
@Injectable()
export class CategoryHelperService {
  resolveCreatePayload(dto: CreateCategoryDto): Partial<Category> {
    return {
      ...dto,
      name: trimSpaces(dto.name),
      description: dto.description ? trimSpaces(dto.description) : undefined,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    };
  }

  resolveUpdatePayload(dto: UpdateCategoryDto): Partial<Category> {
    const payload: Partial<Category> = { ...dto };
    if (typeof payload.name === 'string')
      payload.name = trimSpaces(payload.name);
    if (typeof payload.description === 'string')
      payload.description = trimSpaces(payload.description);
    return payload;
  }

  resolveListFilters(query: GetCategoryQueryDto): FindOptionsWhere<Category> {
    const where: FindOptionsWhere<Category> = {};
    if (query.search) where.name = toILikeContains(trimSpaces(query.search));
    if (query.isActive !== undefined)
      where.isActive = query.isActive === 'true';
    if (query.branchId) where.branchId = query.branchId;
    return where;
  }
}
