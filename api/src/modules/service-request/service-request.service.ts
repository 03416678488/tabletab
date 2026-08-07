import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TenantRequest } from '@modules/tenancy/tenancy.types';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { serviceChannel } from '@modules/realtime/channels';
import { NotificationService } from '@modules/notification/notification.service';

import { ServiceRequest, ServiceRequestType } from './entities/service-request.entity';

/** Staff roles alerted (bell) when a guest requests service. */
const SERVICE_ROLES = ['Waiter', 'Branch Manager', 'Multi Branch Manager', 'Owner'];

const COPY: Record<ServiceRequestType, { title: (t: string) => string; body: (t: string) => string }> = {
  waiter: {
    title: (t) => `Call waiter — Table ${t}`,
    body: (t) => `Table ${t} has requested a waiter.`,
  },
  bill: {
    title: (t) => `Bill requested — Table ${t}`,
    body: (t) => `Table ${t} is ready to pay.`,
  },
};

@Injectable()
export class ServiceRequestService {
  constructor(
    @InjectRepository(ServiceRequest)
    private readonly _repo: Repository<ServiceRequest>,
    private readonly _realtime: RealtimeService,
    private readonly _notifications: NotificationService,
    @Inject(REQUEST) private readonly _req: TenantRequest,
  ) {}

  /** Open queue, oldest first (what the waiter board renders). */
  listOpen(): Promise<ServiceRequest[]> {
    return this._repo.find({ where: { status: 'open' }, order: { createdAt: 'ASC' } });
  }

  /**
   * Record a new request → persist, push a live queue event to the boards, and
   * fan a bell notification out to the branch's service staff.
   */
  async create(input: {
    type: ServiceRequestType;
    tableId: string | null;
    tableName: string | null;
    branchId: string | null;
  }): Promise<ServiceRequest> {
    const saved = await this._repo.save(this._repo.create({ ...input, status: 'open' }));

    this._realtime.publish(serviceChannel(this._req.tenant?.id), 'service.new', { id: saved.id });

    const copy = COPY[input.type];
    const table = input.tableName ?? 'a table';
    await this._notifications.notifyRoles(SERVICE_ROLES, {
      category: 'orders',
      type: `service_${input.type}`,
      title: copy.title(table),
      body: copy.body(table),
      priority: 'high',
      branchId: input.branchId,
      data: { serviceRequestId: saved.id, tableId: input.tableId, tableName: input.tableName },
    });

    return saved;
  }

  /** Mark a request handled and notify the boards to drop it from the queue. */
  async resolve(id: string): Promise<ServiceRequest> {
    await this._repo.update(id, { status: 'resolved', resolvedAt: new Date() });
    this._realtime.publish(serviceChannel(this._req.tenant?.id), 'service.resolved', { id });
    return this._repo.findOneOrFail({ where: { id } });
  }
}
