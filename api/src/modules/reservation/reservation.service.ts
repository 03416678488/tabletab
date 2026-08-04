import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { TenantRequest } from '@modules/tenancy/tenancy.types';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { reservationChannel, reservationsChannel } from '@modules/realtime/channels';

import { Reservation } from './entities/reservation.entity';
import { ReservationValidatorService } from './services/reservation-validator.service';
import { ReservationHelperService } from './services/reservation.helper.service';
import { CreateReservationDto, UpdateReservationDto, GetReservationQueryDto } from './dto';

/** Main reservation flow only — validation + normalization live in sibling services. */
@Injectable()
export class ReservationService extends AbstractService<Reservation> {
  constructor(
    @InjectRepository(Reservation)
    protected readonly repository: Repository<Reservation>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: ReservationValidatorService,
    private readonly _helper: ReservationHelperService,
    private readonly _realtime: RealtimeService,
    @Inject(REQUEST) private readonly _req: TenantRequest,
  ) {
    super(repository, pagination);
  }

  /**
   * Emit after commit: a minimal event to the guest's tracking channel and a
   * "book changed" nudge to the tenant's manager view.
   */
  private emit(reservation: Reservation, type: 'reservation.created' | 'reservation.updated'): void {
    this._realtime.publish(reservationChannel(reservation.id), type, {
      id: reservation.id,
      status: reservation.status,
      updatedAt: reservation.updatedAt,
    });
    this._realtime.publish(reservationsChannel(this._req.tenant?.id), 'reservations.changed', {
      id: reservation.id,
      status: reservation.status,
    });
  }

  getAll(query: GetReservationQueryDto): Promise<Paginated<Reservation>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(query, this.repository, where, ['branch', 'table'], undefined, {
      date: 'ASC',
      time: 'ASC',
    });
  }

  getById(id: string): Promise<Reservation> {
    return this._validator.ensureExists(id);
  }

  async createReservation(dto: CreateReservationDto): Promise<Reservation> {
    await this._validator.validateCreate(dto);
    const saved = await this.create(this._helper.resolveCreatePayload(dto));
    const reservation = await this.getById(saved.id);
    this.emit(reservation, 'reservation.created');
    return reservation;
  }

  async updateReservation(id: string, dto: UpdateReservationDto): Promise<Reservation> {
    await this._validator.ensureExists(id);
    await this.repository.update(id, this._helper.resolveUpdatePayload(dto));
    const reservation = await this.getById(id);
    this.emit(reservation, 'reservation.updated');
    return reservation;
  }

  async deleteReservation(id: string) {
    const reservation = await this._validator.ensureExists(id);
    const result = await this.delete(id);
    this.emit(reservation, 'reservation.updated');
    return result;
  }
}
