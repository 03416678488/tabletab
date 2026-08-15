import { ConflictException, GoneException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { LessThan, Repository } from 'typeorm';

import { TableSession } from './entities/table-session.entity';

/** A sitting is auto-expired after this long with no new orders. */
const IDLE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

@Injectable()
export class TableSessionService {
  constructor(
    @InjectRepository(TableSession)
    private readonly _repo: Repository<TableSession>,
  ) {}

  /**
   * Resolve the session an incoming dine-in order belongs to, enforcing the
   * per-sitting token:
   * - No open session → start a fresh sitting (new token). The scan opens it and
   *   the first order carries no token yet.
   * - Open session + matching token → attach (same device adding another round).
   * - Open session + a *stale* token → 410 Gone: the caller's sitting was
   *   settled and a different one is now active. Blocks a past customer's saved
   *   link from reaching the new customer's bill.
   * - Open session + *no* token while one is active → 409 Conflict: a newcomer
   *   can't silently join an in-progress sitting (staff add via POS instead).
   */
  async resolveForOrder(
    tableId: string,
    branchId: string | null,
    providedToken?: string | null,
  ): Promise<TableSession> {
    const open = await this.currentOpen(tableId);
    if (!open) return this.open(tableId, branchId);

    if (providedToken && providedToken === open.token) return open;

    if (providedToken) {
      throw new GoneException(
        'This table session has ended. Please scan the QR code again to start a new one.',
      );
    }
    throw new ConflictException(
      'A dine-in session is already active at this table. Continue on the device that started it, or ask a staff member to add your order.',
    );
  }

  /** The open, non-idle session for a table (idle ones are auto-closed first). */
  async currentOpen(tableId: string): Promise<TableSession | null> {
    // Sweep any idle open sittings on this table so they can't linger forever.
    await this._repo.update(
      {
        tableId,
        status: 'open',
        lastOrderAt: LessThan(new Date(Date.now() - IDLE_TTL_MS)),
      },
      { status: 'closed', closedAt: new Date() },
    );
    return this._repo.findOne({
      where: { tableId, status: 'open' },
      order: { openedAt: 'DESC' },
    });
  }

  /** Open a new sitting with a fresh unguessable token. */
  async open(tableId: string, branchId: string | null): Promise<TableSession> {
    return this._repo.save(
      this._repo.create({
        tableId,
        branchId,
        token: randomBytes(24).toString('base64url'),
        status: 'open',
        openedAt: new Date(),
        lastOrderAt: new Date(),
      }),
    );
  }

  /** Bump activity so the idle timeout is measured from the latest order. */
  async touch(id: string): Promise<void> {
    await this._repo.update(id, { lastOrderAt: new Date() });
  }

  /** Close every open sitting on a table (called when the table is settled). */
  async closeForTable(tableId: string): Promise<void> {
    await this._repo.update(
      { tableId, status: 'open' },
      { status: 'closed', closedAt: new Date() },
    );
  }
}
