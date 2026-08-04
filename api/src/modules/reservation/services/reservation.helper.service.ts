import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, ILike } from 'typeorm';

import { trimSpaces } from '@cor/helpers';

import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { CreateReservationDto, GetReservationQueryDto, UpdateReservationDto } from '../dto';

/** Pure resolver helpers — payload shaping + query building. */
@Injectable()
export class ReservationHelperService {
  resolveCreatePayload(dto: CreateReservationDto): Partial<Reservation> {
    return {
      branchId: dto.branchId,
      tableId: dto.tableId ?? null,
      partySize: dto.partySize,
      date: dto.date,
      time: dto.time,
      durationMins: dto.durationMins ?? 90,
      guestName: trimSpaces(dto.guestName),
      guestPhone: dto.guestPhone.trim(),
      guestEmail: dto.guestEmail?.trim() || null,
      specialRequests: dto.specialRequests ? trimSpaces(dto.specialRequests) : null,
      status: 'requested',
      source: dto.source ?? 'online',
    };
  }

  resolveUpdatePayload(dto: UpdateReservationDto): Partial<Reservation> {
    const patch: Partial<Reservation> = {};
    if (dto.tableId !== undefined) patch.tableId = dto.tableId || null;
    if (dto.partySize !== undefined) patch.partySize = dto.partySize;
    if (dto.specialRequests !== undefined) {
      patch.specialRequests = dto.specialRequests ? trimSpaces(dto.specialRequests) : null;
    }
    if (dto.status !== undefined) {
      patch.status = dto.status as ReservationStatus;
      const now = new Date();
      // Stamp the lifecycle timestamp for the transition (first time only).
      if (dto.status === 'confirmed') patch.confirmedAt = now;
      if (dto.status === 'seated') patch.seatedAt = now;
      if (dto.status === 'completed') patch.completedAt = now;
    }
    return patch;
  }

  resolveListFilters(query: GetReservationQueryDto): FindOptionsWhere<Reservation> {
    const where: FindOptionsWhere<Reservation> = {};
    if (query.branchId) where.branchId = query.branchId;
    if (query.date) where.date = query.date;
    if (query.status) where.status = query.status as ReservationStatus;
    if (query.search) where.guestName = ILike(`%${trimSpaces(query.search)}%`);
    return where;
  }
}
