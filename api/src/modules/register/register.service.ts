import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ErrorProvider } from '@modules/common/error/error.provider';
import { Transaction } from '@modules/transaction/entities/transaction.entity';
import { Branch } from '@modules/branch/entities/branch.entity';
import { NotificationService } from '@modules/notification/notification.service';

import { RegisterSession } from './entities/register-session.entity';
import {
  CashMovementDto,
  CloseRegisterDto,
  OpenRegisterDto,
} from './dto/register.dto';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface RegisterSummary {
  expectedCash: number;
  cashSales: number;
  cardSales: number;
  mfsSales: number;
  otherSales: number;
  cashIn: number;
  cashOut: number;
  refunds: number;
  salesTotal: number;
  salesCount: number;
}

/** One branch's drawer state for the "All branches" overview. */
export interface RegisterOverviewRow {
  branchId: string;
  branchName: string;
  status: 'open' | 'closed';
  openingBalance: number | null;
  expectedCash: number | null;
  cashSales: number | null;
  cashIn: number | null;
  cashOut: number | null;
  openedAt: string | null;
}

export interface RegisterOverview {
  rows: RegisterOverviewRow[];
  totals: { openDrawers: number; expectedCash: number };
}

@Injectable()
export class RegisterService {
  constructor(
    @InjectRepository(RegisterSession)
    private readonly _repo: Repository<RegisterSession>,
    @InjectRepository(Transaction)
    private readonly _txnRepo: Repository<Transaction>,
    @InjectRepository(Branch)
    private readonly _branchRepo: Repository<Branch>,
    private readonly _errors: ErrorProvider,
    private readonly _notifications: NotificationService,
  ) {}

  /** Notify managers of a register open/close (best-effort). */
  private async notifyRegister(
    type: 'register.opened' | 'register.closed',
    title: string,
    body: string,
    data: Record<string, unknown>,
    branchId?: string | null,
  ): Promise<void> {
    try {
      await this._notifications.notifyRoles(
        ['Owner', 'Multi Branch Manager', 'Branch Manager'],
        {
          category: 'register',
          type,
          title,
          body,
          data,
          priority: 'normal',
          branchId: branchId ?? null,
        },
      );
    } catch (err) {
      console.warn(
        '[notify] register notification failed',
        (err as Error).message,
      );
    }
  }

  /**
   * The open drawer for a branch. With a branchId it is that branch's drawer;
   * without one (legacy / single-branch) it is any open drawer.
   */
  private getOpenSession(
    branchId?: string | null,
  ): Promise<RegisterSession | null> {
    return this._repo.findOne({
      where: { status: 'open', ...(branchId ? { branchId } : {}) },
      order: { openedAt: 'DESC' },
    });
  }

  /** Roll up a session's transactions for display + drawer reconciliation. */
  private async summarize(session: RegisterSession): Promise<RegisterSummary> {
    const txns = await this._txnRepo.find({
      where: { registerSessionId: session.id },
    });
    const s: RegisterSummary = {
      expectedCash: 0,
      cashSales: 0,
      cardSales: 0,
      mfsSales: 0,
      otherSales: 0,
      cashIn: 0,
      cashOut: 0,
      refunds: 0,
      salesTotal: 0,
      salesCount: 0,
    };
    for (const t of txns) {
      if (t.type === 'sale') {
        s.salesTotal += t.amount;
        s.salesCount += 1;
        if (t.method === 'cash') s.cashSales += t.amount;
        else if (t.method === 'card') s.cardSales += t.amount;
        else if (t.method === 'mfs') s.mfsSales += t.amount;
        else s.otherSales += t.amount;
      } else if (t.type === 'refund') {
        s.refunds += t.amount;
      } else if (t.type === 'cash_in') {
        s.cashIn += t.amount;
      } else if (t.type === 'cash_out') {
        s.cashOut += t.amount;
      }
    }
    const cashRefunds = 0; // refunds tracked separately; assume non-cash for v1
    s.expectedCash = round2(
      session.openingBalance + s.cashSales + s.cashIn - s.cashOut - cashRefunds,
    );
    for (const k of Object.keys(s) as (keyof RegisterSummary)[]) {
      s[k] = round2(s[k]);
    }
    return s;
  }

  /** Current open session + its live summary for a branch (or null). */
  async getCurrent(branchId?: string): Promise<{
    session: RegisterSession | null;
    summary: RegisterSummary | null;
  }> {
    const session = await this.getOpenSession(branchId);
    if (!session) return { session: null, summary: null };
    return { session, summary: await this.summarize(session) };
  }

  async open(dto: OpenRegisterDto, userId?: string): Promise<RegisterSession> {
    const branchId = dto.branchId ?? null;
    const existing = await this.getOpenSession(branchId);
    if (existing) {
      this._errors.add(
        'register',
        'A register session is already open for this branch',
      );
      this._errors.throwConflictErrorIfExists();
    }
    const opened = await this._repo.save(
      this._repo.create({
        status: 'open',
        branchId,
        openingBalance: round2(dto.openingBalance),
        note: dto.note ?? null,
        openedBy: userId ?? null,
      }),
    );
    await this.notifyRegister(
      'register.opened',
      'Register opened',
      `Opening balance ${opened.openingBalance}`,
      { sessionId: opened.id },
      branchId,
    );
    return opened;
  }

  async close(
    dto: CloseRegisterDto,
    userId?: string,
  ): Promise<{ session: RegisterSession; summary: RegisterSummary }> {
    const session = await this.getOpenSession(dto.branchId ?? null);
    if (!session) {
      this._errors.add('register', 'No open register session for this branch');
      this._errors.throwNotFoundErrorIfExists();
    }
    const summary = await this.summarize(session);
    session.status = 'closed';
    session.closingCountedBalance = round2(dto.countedBalance);
    session.expectedBalance = summary.expectedCash;
    session.variance = round2(dto.countedBalance - summary.expectedCash);
    session.closedAt = new Date();
    if (dto.note) session.note = dto.note;
    void userId;
    const saved = await this._repo.save(session);
    await this.notifyRegister(
      'register.closed',
      'Register closed',
      `Variance ${saved.variance ?? 0}`,
      { sessionId: saved.id },
      saved.branchId,
    );
    return { session: saved, summary };
  }

  /** Record a cash-in / cash-out movement on the branch's open session. */
  async addCash(dto: CashMovementDto, userId?: string): Promise<Transaction> {
    const session = await this.getOpenSession(dto.branchId ?? null);
    if (!session) {
      this._errors.add('register', 'Open the register before adding cash');
      this._errors.throwNotFoundErrorIfExists();
    }
    return this._txnRepo.save(
      this._txnRepo.create({
        type: dto.type,
        method: 'cash',
        amount: round2(dto.amount),
        registerSessionId: session.id,
        branchId: session.branchId,
        note: dto.note ?? null,
        createdBy: userId ?? null,
      }),
    );
  }

  /** Past sessions, newest first — optionally scoped to one branch. */
  listSessions(branchId?: string): Promise<RegisterSession[]> {
    return this._repo.find({
      where: branchId ? { branchId } : {},
      order: { openedAt: 'DESC' },
      take: 100,
    });
  }

  /**
   * Cross-branch snapshot for the "All branches" view: each branch's current
   * drawer status + cash figures, plus totals. Read-only — drawers are operated
   * one branch at a time.
   */
  async overview(): Promise<RegisterOverview> {
    const branches = await this._branchRepo.find({ order: { name: 'ASC' } });
    const rows: RegisterOverviewRow[] = [];
    let openDrawers = 0;
    let expectedCashTotal = 0;

    for (const b of branches) {
      const session = await this.getOpenSession(b.id);
      const summary = session ? await this.summarize(session) : null;
      if (session) {
        openDrawers += 1;
        expectedCashTotal += summary?.expectedCash ?? 0;
      }
      rows.push({
        branchId: b.id,
        branchName: b.name,
        status: session ? 'open' : 'closed',
        openingBalance: session ? session.openingBalance : null,
        expectedCash: summary?.expectedCash ?? null,
        cashSales: summary?.cashSales ?? null,
        cashIn: summary?.cashIn ?? null,
        cashOut: summary?.cashOut ?? null,
        openedAt: session ? String(session.openedAt) : null,
      });
    }

    return {
      rows,
      totals: { openDrawers, expectedCash: round2(expectedCashTotal) },
    };
  }
}
