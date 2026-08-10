import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { TenantRequest } from '@modules/tenancy/tenancy.types';
import { RealtimeService } from '@modules/realtime/realtime.service';
import {
  reservationChannel,
  reservationsChannel,
} from '@modules/realtime/channels';
import { NotificationService } from '@modules/notification/notification.service';

import { Table } from '@modules/table/entities/table.entity';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { ReservationValidatorService } from './services/reservation-validator.service';
import { ReservationHelperService } from './services/reservation.helper.service';
import {
  CreateReservationDto,
  UpdateReservationDto,
  GetReservationQueryDto,
} from './dto';

/** "HH:mm" → minutes since midnight. */
const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Main reservation flow only — validation + normalization live in sibling services. */
@Injectable()
export class ReservationService extends AbstractService<Reservation> {
  constructor(
    @InjectRepository(Reservation)
    protected readonly repository: Repository<Reservation>,
    @InjectRepository(Table)
    private readonly _tables: Repository<Table>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: ReservationValidatorService,
    private readonly _helper: ReservationHelperService,
    private readonly _realtime: RealtimeService,
    private readonly _notifications: NotificationService,
    @Inject(REQUEST) private readonly _req: TenantRequest,
  ) {
    super(repository, pagination);
  }

  /** Statuses where a reservation still holds its table. */
  private static readonly HOLDING_STATUSES: ReservationStatus[] = [
    'requested',
    'confirmed',
    'seated',
  ];

  /**
   * Tables that can take a party of `partySize` at `branchId` on `date`/`time`
   * for `durationMins` — active tables seating enough people whose slot doesn't
   * overlap an existing holding reservation. Powers the storefront table picker.
   */
  async availableTables(params: {
    branchId: string;
    date: string;
    time: string;
    partySize: number;
    durationMins?: number;
  }): Promise<Table[]> {
    const duration = params.durationMins ?? 90;
    const reqStart = toMinutes(params.time);
    const reqEnd = reqStart + duration;

    const tables = await this._tables.find({
      where: { branchId: params.branchId, isActive: true },
      order: { capacity: 'ASC', name: 'ASC' },
    });
    const fits = tables.filter((t) => t.capacity >= params.partySize);
    if (fits.length === 0) return [];

    // Reservations on the same branch+date that still hold a table.
    const sameDay = await this.repository.find({
      where: {
        branchId: params.branchId,
        date: params.date,
        status: In(ReservationService.HOLDING_STATUSES),
      },
    });

    const busy = new Set<string>();
    for (const r of sameDay) {
      if (!r.tableId) continue;
      const start = toMinutes(r.time);
      const end = start + (r.durationMins ?? 90);
      // Overlap when one starts before the other ends.
      if (start < reqEnd && reqStart < end) busy.add(r.tableId);
    }

    return fits.filter((t) => !busy.has(t.id));
  }

  /** Notify managers/waiters of a new booking (best-effort). */
  private async notifyNew(r: Reservation): Promise<void> {
    try {
      await this._notifications.notifyRoles(
        ['Owner', 'Multi Branch Manager', 'Branch Manager', 'Waiter'],
        {
          category: 'reservations',
          type: 'reservation.created',
          title: `New reservation — ${r.guestName}`,
          body: `Party of ${r.partySize} · ${r.date} ${r.time}`,
          data: { reservationId: r.id },
          priority: 'normal',
          branchId: r.branchId ?? null,
        },
      );
    } catch (err) {
      console.warn(
        '[notify] reservation notification failed',
        (err as Error).message,
      );
    }
  }

  /**
   * Emit after commit: a minimal event to the guest's tracking channel and a
   * "book changed" nudge to the tenant's manager view.
   */
  private emit(
    reservation: Reservation,
    type: 'reservation.created' | 'reservation.updated',
  ): void {
    this._realtime.publish(reservationChannel(reservation.id), type, {
      id: reservation.id,
      status: reservation.status,
      updatedAt: reservation.updatedAt,
    });
    this._realtime.publish(
      reservationsChannel(this._req.tenant?.id),
      'reservations.changed',
      {
        id: reservation.id,
        status: reservation.status,
      },
    );
  }

  getAll(query: GetReservationQueryDto): Promise<Paginated<Reservation>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(
      query,
      this.repository,
      where,
      ['branch', 'table'],
      undefined,
      {
        date: 'ASC',
        time: 'ASC',
      },
    );
  }

  getById(id: string): Promise<Reservation> {
    return this._validator.ensureExists(id);
  }

  async createReservation(dto: CreateReservationDto): Promise<Reservation> {
    await this._validator.validateCreate(dto);
    const saved = await this.create(this._helper.resolveCreatePayload(dto));
    const reservation = await this.getById(saved.id);
    this.emit(reservation, 'reservation.created');
    await this.notifyNew(reservation);
    return reservation;
  }

  async updateReservation(
    id: string,
    dto: UpdateReservationDto,
  ): Promise<Reservation> {
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
