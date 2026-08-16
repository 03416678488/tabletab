import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
import { TransactionService } from '@modules/transaction/transaction.service';

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
    private readonly _transactions: TransactionService,
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

  /** Reject a booking when the branch has reservations switched off. */
  private async enforceReservationsEnabled(branchId?: string): Promise<void> {
    if (!branchId) return;
    const rows: Array<{ reservationsEnabled: boolean }> =
      await this.repository.manager.query(
        `SELECT "reservationsEnabled" FROM branches WHERE id = $1`,
        [branchId],
      );
    if (rows[0] && rows[0].reservationsEnabled === false)
      throw new BadRequestException(
        'This branch is not accepting reservations right now.',
      );
  }

  async createReservation(dto: CreateReservationDto): Promise<Reservation> {
    await this._validator.validateCreate(dto);
    await this.enforceReservationsEnabled(dto.branchId);
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
    const existing = await this._validator.ensureExists(id);

    // A booking deposit is only recorded once. Post the ledger transaction
    // BEFORE stamping the reservation so a booking never shows a deposit without
    // a matching earning; a re-sent deposit on an already-paid booking is ignored.
    const isNewDeposit =
      dto.depositAmount !== undefined &&
      dto.depositAmount > 0 &&
      !existing.depositCollectedAt;
    if (isNewDeposit) {
      const userId = (this._req as unknown as { user?: { id?: string } }).user
        ?.id;
      await this._transactions.record(
        {
          type: 'reservation_deposit',
          method: dto.depositMethod ?? 'cash',
          amount: dto.depositAmount as number,
          branchId: existing.branchId ?? undefined,
          note: `Reservation deposit — ${existing.guestName}`,
        },
        userId,
      );
    } else {
      // Not a fresh deposit — never let a stray amount re-stamp the booking.
      dto.depositAmount = undefined;
      dto.depositMethod = undefined;
    }

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
