import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { User } from '@modules/user/entities/users.entity';

import { Shift } from './entities/shift.entity';
import { ClockInDto } from './dto/shift.dto';

/**
 * Staff clock-in / clock-out. An "open" shift means the person is on duty; the
 * assignment router only ever assigns orders / waiter-calls to on-shift staff.
 */
@Injectable()
export class ShiftService {
  constructor(
    @InjectRepository(Shift)
    private readonly _repo: Repository<Shift>,
    @InjectRepository(User)
    private readonly _users: Repository<User>,
  ) {}

  /** The user's currently open shift, or null. */
  getCurrent(userId: string): Promise<Shift | null> {
    return this._repo.findOne({ where: { userId, status: 'open' } });
  }

  async clockIn(userId: string, dto: ClockInDto): Promise<Shift> {
    const open = await this.getCurrent(userId);
    if (open) throw new BadRequestException('You are already clocked in.');

    let branchId = dto.branchId ?? null;
    if (!branchId) {
      const user = await this._users.findOne({
        where: { id: userId },
        select: ['id', 'branchId'],
      });
      branchId = user?.branchId ?? null;
    }

    return this._repo.save(
      this._repo.create({
        userId,
        branchId,
        status: 'open',
        note: dto.note ?? null,
      }),
    );
  }

  async clockOut(userId: string): Promise<Shift> {
    const open = await this.getCurrent(userId);
    if (!open) throw new BadRequestException('You are not clocked in.');
    open.status = 'closed';
    open.clockOutAt = new Date();
    return this._repo.save(open);
  }

  /** Recent shift history for the user (most recent first). */
  history(userId: string): Promise<Shift[]> {
    return this._repo.find({
      where: { userId },
      order: { clockInAt: 'DESC' },
      take: 30,
    });
  }

  /** Everyone currently on shift (optionally scoped to a branch) — admin board. */
  onShift(branchId?: string): Promise<Shift[]> {
    return this._repo.find({
      where: { status: 'open', ...(branchId ? { branchId } : {}) },
      order: { clockInAt: 'ASC' },
    });
  }

  /** Of the given users, the subset currently on an open shift. */
  async filterOnShift(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];
    const rows = await this._repo.find({
      where: { userId: In(userIds), status: 'open' },
      select: ['userId'],
    });
    return [...new Set(rows.map((r) => r.userId))];
  }
}
