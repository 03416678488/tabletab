import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { TenantRequest } from '@modules/tenancy/tenancy.types';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { eventChannel, eventsChannel } from '@modules/realtime/channels';
import { NotificationService } from '@modules/notification/notification.service';
import { TransactionService } from '@modules/transaction/transaction.service';

import { Event } from './entities/event.entity';
import { EventValidatorService } from './services/event-validator.service';
import { EventHelperService } from './services/event.helper.service';
import { EventMailService } from './services/event-mail.service';
import { CreateEventDto, UpdateEventDto, GetEventQueryDto } from './dto';

/** Main event-booking flow only — validation + normalization live in sibling services. */
@Injectable()
export class EventService extends AbstractService<Event> {
  constructor(
    @InjectRepository(Event)
    protected readonly repository: Repository<Event>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: EventValidatorService,
    private readonly _helper: EventHelperService,
    private readonly _realtime: RealtimeService,
    private readonly _notifications: NotificationService,
    private readonly _transactions: TransactionService,
    private readonly _mail: EventMailService,
    @Inject(REQUEST) private readonly _req: TenantRequest,
  ) {
    super(repository, pagination);
  }

  /** Notify managers of a new event inquiry (best-effort). */
  private async notifyNew(e: Event): Promise<void> {
    try {
      await this._notifications.notifyRoles(
        ['Owner', 'Multi Branch Manager', 'Branch Manager'],
        {
          category: 'events',
          type: 'event.created',
          title: `New event inquiry — ${e.title}`,
          body: `${e.guestName} · ${e.guestCount} guests · ${e.date} ${e.startTime}`,
          data: { eventId: e.id },
          priority: 'normal',
          branchId: e.branchId ?? null,
        },
      );
    } catch (err) {
      console.warn(
        '[notify] event notification failed',
        (err as Error).message,
      );
    }
  }

  /** Emit after commit: guest tracking channel + a "book changed" nudge for staff. */
  private emit(event: Event, type: 'event.created' | 'event.updated'): void {
    this._realtime.publish(eventChannel(event.id), type, {
      id: event.id,
      status: event.status,
      updatedAt: event.updatedAt,
    });
    this._realtime.publish(
      eventsChannel(this._req.tenant?.id),
      'events.changed',
      {
        id: event.id,
        status: event.status,
      },
    );
  }

  getAll(query: GetEventQueryDto): Promise<Paginated<Event>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(
      query,
      this.repository,
      where,
      ['branch', 'eventType'],
      undefined,
      { date: 'ASC', startTime: 'ASC' },
    );
  }

  getById(id: string): Promise<Event> {
    return this._validator.ensureExists(id);
  }

  /** Reject a booking when the branch has event bookings switched off. */
  private async enforceEventsEnabled(branchId?: string): Promise<void> {
    if (!branchId) return;
    const rows: Array<{ eventsEnabled: boolean }> =
      await this.repository.manager.query(
        `SELECT "eventsEnabled" FROM branches WHERE id = $1`,
        [branchId],
      );
    if (rows[0] && rows[0].eventsEnabled === false)
      throw new BadRequestException(
        'This branch is not accepting event bookings right now.',
      );
  }

  async createEvent(dto: CreateEventDto): Promise<Event> {
    await this._validator.validateCreate(dto);
    await this.enforceEventsEnabled(dto.branchId);
    const saved = await this.create(this._helper.resolveCreatePayload(dto));
    const event = await this.getById(saved.id);
    this.emit(event, 'event.created');
    await this.notifyNew(event);
    await this._mail.notify(event, true);
    return event;
  }

  async updateEvent(id: string, dto: UpdateEventDto): Promise<Event> {
    const existing = await this._validator.ensureExists(id);

    // An event payment is only recorded once. Post the ledger transaction BEFORE
    // stamping the event so a booking never shows a payment without a matching
    // earning; a re-sent payment on an already-paid booking is ignored.
    const isNewPayment =
      dto.paymentAmount !== undefined &&
      dto.paymentAmount > 0 &&
      !existing.paymentCollectedAt;
    if (isNewPayment) {
      const userId = (this._req as unknown as { user?: { id?: string } }).user
        ?.id;
      await this._transactions.record(
        {
          type: 'event_payment',
          method: dto.paymentMethod ?? 'cash',
          amount: dto.paymentAmount as number,
          branchId: existing.branchId ?? undefined,
          note: `Event payment — ${existing.title}`,
        },
        userId,
      );
    } else {
      dto.paymentAmount = undefined;
      dto.paymentMethod = undefined;
    }

    await this.repository.update(id, this._helper.resolveUpdatePayload(dto));
    const event = await this.getById(id);
    this.emit(event, 'event.updated');
    // Email the guest only when the status actually changed.
    if (dto.status && dto.status !== existing.status) {
      await this._mail.notify(event, false);
    }
    return event;
  }

  async deleteEvent(id: string) {
    const event = await this._validator.ensureExists(id);
    const result = await this.delete(id);
    this.emit(event, 'event.updated');
    return result;
  }
}
