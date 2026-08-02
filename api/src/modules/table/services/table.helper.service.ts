import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, ILike } from 'typeorm';

import { trimSpaces } from '@cor/helpers';

import { Table } from '../entities/table.entity';
import { CreateTableDto, UpdateTableDto, GetTableQueryDto } from '../dto';

/** Pure resolver helpers — normalization, defaults and query building. */
@Injectable()
export class TableHelperService {
  resolveCreatePayload(dto: CreateTableDto): Partial<Table> {
    return {
      ...dto,
      name: trimSpaces(dto.name),
      capacity: dto.capacity ?? 2,
      isActive: dto.isActive ?? true,
    };
  }

  resolveUpdatePayload(dto: UpdateTableDto): Partial<Table> {
    const payload: Partial<Table> = { ...dto };
    if (typeof payload.name === 'string') payload.name = trimSpaces(payload.name);
    return payload;
  }

  resolveListFilters(query: GetTableQueryDto): FindOptionsWhere<Table> {
    const where: FindOptionsWhere<Table> = {};
    if (query.search) where.name = ILike(`%${trimSpaces(query.search)}%`);
    if (query.branchId) where.branchId = query.branchId;
    if (query.areaId) where.areaId = query.areaId;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    return where;
  }
}
