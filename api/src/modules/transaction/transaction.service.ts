import { Injectable } from '@nestjs/common';
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
    const session = await this._sessionRepo.findOne({
      where: { status: 'open' },
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
}
