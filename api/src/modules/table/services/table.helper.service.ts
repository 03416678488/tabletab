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

  resolveListFilters(
    query: GetTableQueryDto,
  ): FindOptionsWhere<Table> | FindOptionsWhere<Table>[] {
    const base: FindOptionsWhere<Table> = {};
    if (query.branchId) base.branchId = query.branchId;
    if (query.areaId) base.areaId = query.areaId;
    if (query.isActive !== undefined) base.isActive = query.isActive === 'true';

    const term = trimSpaces(query.search ?? '');
    if (term) {
      const like = ILike(`%${term}%`);
      return [
        { ...base, name: like },
        { ...base, area: { name: like } },
        { ...base, branch: { name: like } },
      ];
    }

    return base;
  }
}
