import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';

import { trimSpaces } from '@cor/helpers';
import { toILikeContains } from '@cor/helpers/query.helper';

import { EventType } from '../entities/event-type.entity';
import {
  CreateEventTypeDto,
  UpdateEventTypeDto,
  GetEventTypeQueryDto,
} from '../dto';

/** Pure resolver helpers for the event-type catalogue. */
@Injectable()
export class EventTypeHelperService {
  resolveCreatePayload(dto: CreateEventTypeDto): Partial<EventType> {
    return {
      name: trimSpaces(dto.name),
      description: dto.description ? trimSpaces(dto.description) : null,
      imageUrl: dto.imageUrl?.trim() || null,
      basePrice: dto.basePrice ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    };
  }

  resolveUpdatePayload(dto: UpdateEventTypeDto): Partial<EventType> {
    const patch: Partial<EventType> = {};
    if (dto.name !== undefined) patch.name = trimSpaces(dto.name);
    if (dto.description !== undefined)
      patch.description = dto.description ? trimSpaces(dto.description) : null;
    if (dto.imageUrl !== undefined)
      patch.imageUrl = dto.imageUrl?.trim() || null;
    if (dto.basePrice !== undefined) patch.basePrice = dto.basePrice || null;
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) patch.isActive = dto.isActive;
    return patch;
  }

  resolveListFilters(query: GetEventTypeQueryDto): FindOptionsWhere<EventType> {
    const where: FindOptionsWhere<EventType> = {};
    if (query.search) where.name = toILikeContains(trimSpaces(query.search));
    if (query.isActive !== undefined)
      where.isActive = query.isActive === 'true';
    return where;
  }
}
