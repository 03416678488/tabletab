import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';

import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { notifChannel } from '@modules/realtime/channels';
import { UserRolePermissions } from '@modules/role/entities/user-role-permissions.entity';
import { User } from '@modules/user/entities/users.entity';

/** Roles that see events across every branch (not scoped to one). */
const CROSS_BRANCH_ROLES = new Set(['Owner', 'Multi Branch Manager']);

import {
  Notification,
  NotificationPriority,
} from './entities/notification.entity';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';

/** A notification to emit — recipients are resolved separately. */
export interface NewNotification {
  category: string;
  type: string;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
  priority?: NotificationPriority;
  branchId?: string | null;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly _repo: Repository<Notification>,
    @InjectRepository(UserRolePermissions)
    private readonly _userRoles: Repository<UserRolePermissions>,
    private readonly _pagination: PaginationProvider,
    private readonly _realtime: RealtimeService,
  ) {}

  /**
   * Fan a single event out to every user holding one of the given roles, scoped
   * to the event's branch: cross-branch roles (Owner / Multi Branch Manager) and
   * users with no branch assignment always receive it; branch-scoped roles get
   * it only when their branch matches. A branch-less event reaches everyone.
   */
  async notifyRoles(
    roleNames: string[],
    payload: NewNotification,
  ): Promise<void> {
    if (roleNames.length === 0) return;

    const rows = await this._userRoles
      .createQueryBuilder('urp')
      .innerJoin('urp.role', 'role')
      .innerJoin(User, 'u', 'u.id = urp.userId')
      .where('role.name IN (:...roleNames)', { roleNames })
      .select('urp.userId', 'userId')
      .addSelect('role.name', 'roleName')
      .addSelect('u.branchId', 'branchId')
      .getRawMany<{
        userId: string;
        roleName: string;
        branchId: string | null;
      }>();

    const eventBranch = payload.branchId ?? null;
    const recipients = new Set<string>();
    for (const r of rows) {
      const include =
        CROSS_BRANCH_ROLES.has(r.roleName) ||
        eventBranch === null ||
        r.branchId === null ||
        r.branchId === eventBranch;
      if (include) recipients.add(r.userId);
    }

    await this.notifyUsers([...recipients], payload);
  }

  /** Persist one row per recipient, then push a light "new" event to each. */
  async notifyUsers(
    userIds: string[],
    payload: NewNotification,
  ): Promise<void> {
    const unique = [...new Set(userIds)].filter(Boolean);
    if (unique.length === 0) return;

    const entities = unique.map((userId) =>
      this._repo.create({
        userId,
        category: payload.category,
        type: payload.type,
        title: payload.title,
        body: payload.body ?? null,
        data: payload.data ?? null,
        priority: payload.priority ?? 'normal',
        branchId: payload.branchId ?? null,
      }),
    );
    const saved = await this._repo.save(entities);

    // Push a minimal signal; the client reconciles the details over REST.
    for (const n of saved) {
      this._realtime.publish(notifChannel(n.userId), 'notification.new', {
        id: n.id,
        category: n.category,
        type: n.type,
        priority: n.priority,
        branchId: n.branchId,
      });
    }
  }

  /**
   * Build the where-clause for a user's notifications, branch-scoped when a
   * branch is given: a specific branch shows that branch's events **plus**
   * branch-less (global) ones. Returns an OR array when scoped.
   */
  private scopedWhere(
    base: FindOptionsWhere<Notification>,
    branchId?: string,
  ): FindOptionsWhere<Notification> | FindOptionsWhere<Notification>[] {
    if (!branchId) return base;
    return [
      { ...base, branchId },
      { ...base, branchId: IsNull() },
    ];
  }

  list(
    userId: string,
    query: GetNotificationsQueryDto,
  ): Promise<Paginated<Notification>> {
    const base: FindOptionsWhere<Notification> = { userId };
    if (query.category) base.category = query.category;
    if (query.status === 'unread') base.readAt = IsNull();

    return this._pagination.paginationQuery(
      query,
      this._repo,
      this.scopedWhere(base, query.branchId),
      undefined,
      undefined,
      { createdAt: 'DESC' },
    );
  }

  async unreadCount(
    userId: string,
    branchId?: string,
  ): Promise<{ count: number }> {
    const count = await this._repo.count({
      where: this.scopedWhere({ userId, readAt: IsNull() }, branchId),
    });
    return { count };
  }

  async markRead(userId: string, id: string): Promise<{ success: true }> {
    await this._repo.update(
      { id, userId, readAt: IsNull() },
      { readAt: new Date() },
    );
    return { success: true };
  }

  async markAllRead(userId: string): Promise<{ success: true }> {
    await this._repo.update(
      { userId, readAt: IsNull() },
      { readAt: new Date() },
    );
    return { success: true };
  }

  /** Mark every unread notification in one category read (auto-read on context). */
  async markCategoryRead(
    userId: string,
    category: string,
  ): Promise<{ success: true }> {
    await this._repo.update(
      { userId, category, readAt: IsNull() },
      { readAt: new Date() },
    );
    return { success: true };
  }
}
