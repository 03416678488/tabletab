import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';

import { trimSpaces } from '@cor/helpers';

import { Menu } from '../entities/menu.entity';
import { CreateMenuDto, UpdateMenuDto, GetMenuQueryDto } from '../dto';
import { toILikeContains } from '@cor/helpers/query.helper';

/** Pure resolver helpers — normalization, defaults and query building. */
@Injectable()
export class MenusHelperService {
  resolveCreatePayload(dto: CreateMenuDto): Partial<Menu> {
    return {
      ...dto,
      name: trimSpaces(dto.name),
      description: dto.description ? trimSpaces(dto.description) : undefined,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    };
  }

  resolveUpdatePayload(dto: UpdateMenuDto): Partial<Menu> {
    const payload: Partial<Menu> = { ...dto };
    if (typeof payload.name === 'string')
      payload.name = trimSpaces(payload.name);
    if (typeof payload.description === 'string')
      payload.description = trimSpaces(payload.description);
    return payload;
  }

  resolveListFilters(query: GetMenuQueryDto): FindOptionsWhere<Menu> {
    const where: FindOptionsWhere<Menu> = {};
    if (query.search) where.name = toILikeContains(trimSpaces(query.search));
    if (query.isActive !== undefined)
      where.isActive = query.isActive === 'true';
    if (query.branchId) where.branchId = query.branchId;
    return where;
  }
}
