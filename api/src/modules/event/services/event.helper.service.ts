import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';

import { trimSpaces } from '@cor/helpers';
import { toILikeContains } from '@cor/helpers/query.helper';

import { Event, EventStatus } from '../entities/event.entity';
import { CreateEventDto, UpdateEventDto, GetEventQueryDto } from '../dto';

/** Pure resolver helpers — payload shaping + query building. */
@Injectable()
export class EventHelperService {
  resolveCreatePayload(dto: CreateEventDto): Partial<Event> {
    return {
      eventTypeId: dto.eventTypeId ?? null,
      branchId: dto.branchId ?? null,
      title: trimSpaces(dto.title),
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime ?? null,
      guestCount: dto.guestCount,
      guestName: trimSpaces(dto.guestName),
      guestPhone: dto.guestPhone.trim(),
      guestEmail: dto.guestEmail?.trim() || null,
      budget: dto.budget ?? null,
      specialRequests: dto.specialRequests
        ? trimSpaces(dto.specialRequests)
        : null,
      status: 'requested',
      source: dto.source ?? 'online',
    };
  }

  resolveUpdatePayload(dto: UpdateEventDto): Partial<Event> {
    const patch: Partial<Event> = {};
    if (dto.eventTypeId !== undefined)
      patch.eventTypeId = dto.eventTypeId || null;
    if (dto.branchId !== undefined) patch.branchId = dto.branchId || null;
    if (dto.title !== undefined) patch.title = trimSpaces(dto.title);
    if (dto.date !== undefined) patch.date = dto.date;
    if (dto.startTime !== undefined) patch.startTime = dto.startTime;
    if (dto.endTime !== undefined) patch.endTime = dto.endTime || null;
    if (dto.guestCount !== undefined) patch.guestCount = dto.guestCount;
    if (dto.budget !== undefined) patch.budget = dto.budget || null;
    if (dto.specialRequests !== undefined) {
      patch.specialRequests = dto.specialRequests
        ? trimSpaces(dto.specialRequests)
        : null;
    }
    if (dto.status !== undefined) {
      patch.status = dto.status as EventStatus;
      const now = new Date();
      if (dto.status === 'confirmed') patch.confirmedAt = now;
      if (dto.status === 'completed') patch.completedAt = now;
      // Record the reason on cancel; clear any stale reason when re-opened.
      if (dto.status === 'cancelled') {
        patch.cancellationReason = dto.cancellationReason
          ? trimSpaces(dto.cancellationReason)
          : null;
      } else {
        patch.cancellationReason = null;
      }
    } else if (dto.cancellationReason !== undefined) {
      patch.cancellationReason = dto.cancellationReason
        ? trimSpaces(dto.cancellationReason)
        : null;
    }
    // A payment being recorded now — stamp amount/method/time. The matching
    // ledger transaction is posted by the service (this resolver stays pure).
    if (dto.paymentAmount !== undefined && dto.paymentAmount > 0) {
      patch.paymentAmount = dto.paymentAmount;
      patch.paymentMethod = dto.paymentMethod ?? 'cash';
      patch.paymentCollectedAt = new Date();
    }
    return patch;
  }

  resolveListFilters(query: GetEventQueryDto): FindOptionsWhere<Event> {
    const where: FindOptionsWhere<Event> = {};
    if (query.branchId) where.branchId = query.branchId;
    if (query.eventTypeId) where.eventTypeId = query.eventTypeId;
    if (query.date) where.date = query.date;
    if (query.status) where.status = query.status as EventStatus;
    if (query.search)
      where.guestName = toILikeContains(trimSpaces(query.search));
    return where;
  }
}
