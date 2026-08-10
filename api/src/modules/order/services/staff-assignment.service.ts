import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@modules/user/entities/users.entity';
import { UserRolePermissions } from '@modules/role/entities/user-role-permissions.entity';
import { ShiftService } from '@modules/shift/shift.service';

import { Order, OrderStatus } from '../entities/order.entity';

/** Roles the router assigns work to, mapped to the order column that holds them. */
export type AssignableRole = 'Chef' | 'Waiter' | 'Delivery Rider';

const COLUMN_BY_ROLE: Record<
  AssignableRole,
  'assignedChefId' | 'assignedWaiterId' | 'assignedRiderId'
> = {
  Chef: 'assignedChefId',
  Waiter: 'assignedWaiterId',
  'Delivery Rider': 'assignedRiderId',
};

/** Statuses where an assigned order still counts against a person's workload. */
const ACTIVE_ASSIGNMENT_STATUSES: OrderStatus[] = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'served',
  'out-for-delivery',
];

/**
 * Picks WHICH staff member a piece of work goes to. Candidates must (1) hold the
 * role, (2) belong to the branch, and (3) be on an open shift. Among on-shift
 * candidates the least-busy (fewest active assigned orders) wins, ties broken
 * randomly; a lone on-shift candidate is assigned directly. Returns null when
 * nobody of that role is on shift — the caller then falls back to a broadcast.
 */
@Injectable()
export class StaffAssignmentService {
  constructor(
    @InjectRepository(UserRolePermissions)
    private readonly _userRoles: Repository<UserRolePermissions>,
    @InjectRepository(Order)
    private readonly _orders: Repository<Order>,
    private readonly _shifts: ShiftService,
  ) {}

  async pickAssignee(
    role: AssignableRole,
    branchId: string | null,
  ): Promise<string | null> {
    const candidates = await this.roleCandidates(role, branchId);
    if (candidates.length === 0) return null;

    const onShift = await this._shifts.filterOnShift(candidates);
    if (onShift.length === 0) return null;
    if (onShift.length === 1) return onShift[0];

    const load = await this.loadByUser(COLUMN_BY_ROLE[role], onShift);
    const min = Math.min(...onShift.map((u) => load.get(u) ?? 0));
    const leastBusy = onShift.filter((u) => (load.get(u) ?? 0) === min);
    return leastBusy[Math.floor(Math.random() * leastBusy.length)];
  }

  /** Active, non-deleted users holding `role`, scoped to the branch (cross-branch
   *  and unassigned users are eligible for any branch — mirrors notification scoping). */
  private async roleCandidates(
    role: string,
    branchId: string | null,
  ): Promise<string[]> {
    const rows = await this._userRoles
      .createQueryBuilder('urp')
      .innerJoin('urp.role', 'role')
      .innerJoin(User, 'u', 'u.id = urp.userId')
      .where('role.name = :role', { role })
      .andWhere('u.isActive = true')
      .andWhere('u.isDeleted = false')
      .select('urp.userId', 'userId')
      .addSelect('u.branchId', 'branchId')
      .getRawMany<{ userId: string; branchId: string | null }>();

    const out = new Set<string>();
    for (const r of rows) {
      if (branchId === null || r.branchId === null || r.branchId === branchId) {
        out.add(r.userId);
      }
    }
    return [...out];
  }

  /** How many active orders each of `userIds` is currently assigned via `column`. */
  private async loadByUser(
    column: 'assignedChefId' | 'assignedWaiterId' | 'assignedRiderId',
    userIds: string[],
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (userIds.length === 0) return map;
    const rows = await this._orders
      .createQueryBuilder('o')
      .select(`o.${column}`, 'userId')
      .addSelect('COUNT(*)', 'cnt')
      .where(`o.${column} IN (:...userIds)`, { userIds })
      .andWhere('o.status IN (:...active)', {
        active: ACTIVE_ASSIGNMENT_STATUSES,
      })
      .groupBy(`o.${column}`)
      .getRawMany<{ userId: string; cnt: string }>();
    for (const r of rows) map.set(r.userId, Number(r.cnt));
    return map;
  }
}
