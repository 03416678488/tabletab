import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';

import { trimSpaces } from '@cor/helpers';

import { Area } from '../entities/area.entity';
import { CreateAreaDto, UpdateAreaDto, GetAreaQueryDto } from '../dto';
import { toILikeContains } from '@cor/helpers/query.helper';

@Injectable()
export class AreaHelperService {
  resolveCreatePayload(dto: CreateAreaDto): Partial<Area> {
    return { name: trimSpaces(dto.name) };
  }

  resolveUpdatePayload(dto: UpdateAreaDto): Partial<Area> {
    const payload: Partial<Area> = { ...dto };
    if (typeof payload.name === 'string') payload.name = trimSpaces(payload.name);
    return payload;
  }

  resolveListFilters(query: GetAreaQueryDto): FindOptionsWhere<Area> {
    const where: FindOptionsWhere<Area> = {};
    if (query.search) where.name = toILikeContains(trimSpaces(query.search));
    return where;
  }
}
