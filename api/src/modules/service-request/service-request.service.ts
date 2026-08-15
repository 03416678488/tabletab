import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';

import { TenantRequest } from '@modules/tenancy/tenancy.types';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { serviceChannel } from '@modules/realtime/channels';
import { NotificationService } from '@modules/notification/notification.service';
import { StaffAssignmentService } from '@modules/order/services/staff-assignment.service';

import {
  ServiceRequest,
  ServiceRequestType,
} from './entities/service-request.entity';

/** Staff roles alerted (bell) when a guest requests service. */
const SERVICE_ROLES = [
  'Waiter',
  'Branch Manager',
  'Multi Branch Manager',
  'Owner',
];

const COPY: Record<
  ServiceRequestType,
  { title: (t: string) => string; body: (t: string) => string }
> = {
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
    private readonly _assignment: StaffAssignmentService,
    @Inject(REQUEST) private readonly _req: TenantRequest,
  ) {}

  /** Open queue, oldest first (what the waiter board renders). Managers see the
   *  whole queue; a waiter sees only requests assigned to them plus any still
   *  unassigned (the fallback pool). */
  listOpen(
    user?: AuthenticatedUser,
    branchId?: string,
  ): Promise<ServiceRequest[]> {
    // Scope to the topbar branch when given (each request belongs to one table's
    // branch); "All branches" (no branchId) shows the whole queue.
    const base = { status: 'open' as const, ...(branchId ? { branchId } : {}) };
    const roles = new Set(user?.roleNames ?? []);
    const isManager =
      !user ||
      user.isSuperAdmin ||
      roles.has('Owner') ||
      roles.has('Multi Branch Manager') ||
      roles.has('Branch Manager');
    if (isManager || !roles.has('Waiter')) {
      return this._repo.find({ where: base, order: { createdAt: 'ASC' } });
    }
    return this._repo.find({
      where: [
        { ...base, assignedUserId: user.id },
        { ...base, assignedUserId: IsNull() },
      ],
      order: { createdAt: 'ASC' },
    });
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
    // Assign the request to one on-shift waiter so it's their job, not a free-for-all.
    const assignedUserId = await this._assignment.pickAssignee(
      'Waiter',
      input.branchId,
    );
    const saved = await this._repo.save(
      this._repo.create({ ...input, status: 'open', assignedUserId }),
    );

    this._realtime.publish(
      serviceChannel(this._req.tenant?.id),
      'service.new',
      {
        id: saved.id,
        assignedUserId,
      },
    );

    const copy = COPY[input.type];
    const table = input.tableName ?? 'a table';
    const payload = {
      category: 'orders' as const,
      type: `service_${input.type}`,
      title: copy.title(table),
      body: copy.body(table),
      priority: 'high' as const,
      branchId: input.branchId,
      data: {
        serviceRequestId: saved.id,
        tableId: input.tableId,
        tableName: input.tableName,
      },
    };

    // Notify ONLY the assigned waiter; if nobody's on shift, fall back to the
    // whole service crew so the guest is never left waiting.
    if (assignedUserId) {
      await this._notifications.notifyUsers([assignedUserId], payload);
    } else {
      await this._notifications.notifyRoles(SERVICE_ROLES, payload);
    }

    return saved;
  }

  /** Mark a request handled and notify the boards to drop it from the queue. */
  async resolve(id: string): Promise<ServiceRequest> {
    await this._repo.update(id, { status: 'resolved', resolvedAt: new Date() });
    this._realtime.publish(
      serviceChannel(this._req.tenant?.id),
      'service.resolved',
      { id },
    );
    return this._repo.findOneOrFail({ where: { id } });
  }
}
