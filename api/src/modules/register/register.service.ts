import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ErrorProvider } from '@modules/common/error/error.provider';
import { Transaction } from '@modules/transaction/entities/transaction.entity';

import { RegisterSession } from './entities/register-session.entity';
import { CashMovementDto, CloseRegisterDto, OpenRegisterDto } from './dto/register.dto';

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

@Injectable()
export class RegisterService {
  constructor(
    @InjectRepository(RegisterSession)
    private readonly _repo: Repository<RegisterSession>,
    @InjectRepository(Transaction)
    private readonly _txnRepo: Repository<Transaction>,
    private readonly _errors: ErrorProvider,
  ) {}

  private getOpenSession(): Promise<RegisterSession | null> {
    return this._repo.findOne({
      where: { status: 'open' },
      order: { openedAt: 'DESC' },
    });
  }

  /** Roll up a session's transactions for display + drawer reconciliation. */
  private async summarize(
    session: RegisterSession,
  ): Promise<RegisterSummary> {
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

  /** Current open session + its live summary (or null). */
  async getCurrent(): Promise<{
    session: RegisterSession | null;
    summary: RegisterSummary | null;
  }> {
    const session = await this.getOpenSession();
    if (!session) return { session: null, summary: null };
    return { session, summary: await this.summarize(session) };
  }

  async open(dto: OpenRegisterDto, userId?: string): Promise<RegisterSession> {
    const existing = await this.getOpenSession();
    if (existing) {
      this._errors.add('register', 'A register session is already open');
      this._errors.throwConflictErrorIfExists();
    }
    return this._repo.save(
      this._repo.create({
        status: 'open',
        openingBalance: round2(dto.openingBalance),
        note: dto.note ?? null,
        openedBy: userId ?? null,
      }),
    );
  }

  async close(
    dto: CloseRegisterDto,
    userId?: string,
  ): Promise<{ session: RegisterSession; summary: RegisterSummary }> {
    const session = await this.getOpenSession();
    if (!session) {
      this._errors.add('register', 'No open register session');
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
    return { session: saved, summary };
  }

  /** Record a cash-in / cash-out movement on the open session. */
  async addCash(dto: CashMovementDto, userId?: string): Promise<Transaction> {
    const session = await this.getOpenSession();
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
        note: dto.note ?? null,
        createdBy: userId ?? null,
      }),
    );
  }

  /** Past sessions, newest first. */
  listSessions(): Promise<RegisterSession[]> {
    return this._repo.find({ order: { openedAt: 'DESC' }, take: 100 });
  }
}
