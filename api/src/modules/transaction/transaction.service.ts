import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';

import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { RegisterSession } from '@modules/register/entities/register-session.entity';
import { NotificationService } from '@modules/notification/notification.service';

import { Transaction } from './entities/transaction.entity';
import {
  CreateTransactionDto,
  GetTransactionQueryDto,
} from './dto/transaction.dto';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Money-in transaction types (vs refund / cash_out which are money-out). */
const MONEY_IN = new Set<string>([
  'sale',
  'cash_in',
  'reservation_deposit',
  'event_payment',
]);

export interface TransactionSummary {
  count: number;
  totalIn: number;
  totalOut: number;
  net: number;
  byType: { type: string; count: number; sum: number }[];
}

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly _repo: Repository<Transaction>,
    @InjectRepository(RegisterSession)
    private readonly _sessionRepo: Repository<RegisterSession>,
    private readonly _pagination: PaginationProvider,
    private readonly _notifications: NotificationService,
  ) {}

  /** Record a transaction, auto-attaching it to the open register session. */
  async record(
    dto: CreateTransactionDto,
    userId?: string,
  ): Promise<Transaction> {
    // Attach to the open drawer of the transaction's branch (registers are
    // per-branch); fall back to any open drawer when no branch is given.
    const session = await this._sessionRepo.findOne({
      where: {
        status: 'open',
        ...(dto.branchId ? { branchId: dto.branchId } : {}),
      },
      order: { openedAt: 'DESC' },
    });
    const saved = await this._repo.save(
      this._repo.create({
        type: dto.type as Transaction['type'],
        method: dto.method as Transaction['method'],
        amount: round2(dto.amount),
        orderId: dto.orderId ?? null,
        branchId: dto.branchId ?? null,
        registerSessionId: session?.id ?? null,
        note: dto.note ?? null,
        createdBy: userId ?? null,
      }),
    );

    // Refunds warrant manager attention (best-effort — never block the flow).
    if (saved.type === 'refund') {
      try {
        await this._notifications.notifyRoles(
          ['Owner', 'Multi Branch Manager', 'Branch Manager'],
          {
            category: 'payments',
            type: 'payment.refund',
            title: `Refund issued`,
            body: `${saved.method} · ${saved.amount}`,
            data: { transactionId: saved.id, orderId: saved.orderId },
            priority: 'high',
          },
        );
      } catch (err) {
        console.warn(
          '[notify] refund notification failed',
          (err as Error).message,
        );
      }
    }

    return saved;
  }

  getAll(query: GetTransactionQueryDto): Promise<Paginated<Transaction>> {
    // Filters common to every branch of the (possible) OR below.
    const base: FindOptionsWhere<Transaction> = {};
    if (query.type) base.type = query.type as Transaction['type'];
    if (query.method) base.method = query.method as Transaction['method'];
    if (query.registerSessionId)
      base.registerSessionId = query.registerSessionId;

    if (query.from && query.to) {
      base.createdAt = Between(new Date(query.from), new Date(query.to));
    } else if (query.from) {
      base.createdAt = MoreThanOrEqual(new Date(query.from));
    } else if (query.to) {
      base.createdAt = LessThanOrEqual(new Date(query.to));
    }

    if (query.minAmount != null && query.maxAmount != null) {
      base.amount = Between(query.minAmount, query.maxAmount);
    } else if (query.minAmount != null) {
      base.amount = MoreThanOrEqual(query.minAmount);
    } else if (query.maxAmount != null) {
      base.amount = LessThanOrEqual(query.maxAmount);
    }

    // Branch scope: a transaction belongs to a branch either directly (ancillary
    // earnings carry their own branchId) or via its order (sales/refunds derive
    // it from the order). "All branches" (no branchId) applies no branch filter.
    const where:
      FindOptionsWhere<Transaction> | FindOptionsWhere<Transaction>[] =
      query.branchId
        ? [
            { ...base, branchId: query.branchId },
            { ...base, order: { branchId: query.branchId } },
          ]
        : base;

    return this._pagination.paginationQuery(
      query,
      this._repo,
      where,
      // Load the order's assigned waiter so the list can show who served it.
      ['order', 'order.assignedWaiter'],
      undefined,
      {
        createdAt: 'DESC',
      },
    );
  }

  /**
   * Aggregate the CURRENT filter into headline figures for the summary bar:
   * count, money-in vs money-out totals, net, and a per-type breakdown. Mirrors
   * getAll's filters (branch via own-branch OR the order's).
   */
  async summary(query: GetTransactionQueryDto): Promise<TransactionSummary> {
    const qb = this._repo
      .createQueryBuilder('t')
      .leftJoin('t.order', 'o')
      .select('t.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'sum')
      .groupBy('t.type');

    if (query.type) qb.andWhere('t.type = :type', { type: query.type });
    if (query.method)
      qb.andWhere('t.method = :method', { method: query.method });
    if (query.registerSessionId)
      qb.andWhere('t."registerSessionId" = :rs', {
        rs: query.registerSessionId,
      });
    if (query.from)
      qb.andWhere('t."createdAt" >= :from', { from: new Date(query.from) });
    if (query.to)
      qb.andWhere('t."createdAt" <= :to', { to: new Date(query.to) });
    if (query.minAmount != null)
      qb.andWhere('t.amount >= :min', { min: query.minAmount });
    if (query.maxAmount != null)
      qb.andWhere('t.amount <= :max', { max: query.maxAmount });
    if (query.branchId)
      qb.andWhere('(t."branchId" = :b OR o."branchId" = :b)', {
        b: query.branchId,
      });

    const rows = await qb.getRawMany<{
      type: string;
      count: string;
      sum: string;
    }>();

    let count = 0;
    let totalIn = 0;
    let totalOut = 0;
    const byType = rows.map((r) => {
      const c = Number(r.count);
      const sum = round2(Number(r.sum));
      count += c;
      if (MONEY_IN.has(r.type)) totalIn += sum;
      else totalOut += sum;
      return { type: r.type, count: c, sum };
    });

    return {
      count,
      totalIn: round2(totalIn),
      totalOut: round2(totalOut),
      net: round2(totalIn - totalOut),
      byType,
    };
  }

  /** Full detail for the transaction drawer (order lines, customer, register). */
  async getById(id: string): Promise<Transaction> {
    const txn = await this._repo.findOne({
      where: { id },
      relations: [
        'order',
        'order.items',
        'order.assignedWaiter',
        'order.customer',
        'registerSession',
      ],
    });
    if (!txn) throw new NotFoundException('Transaction not found');
    return txn;
  }
}
