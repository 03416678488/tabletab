import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { RegisterSession } from '@modules/register/entities/register-session.entity';

import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto, GetTransactionQueryDto } from './dto/transaction.dto';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly _repo: Repository<Transaction>,
    @InjectRepository(RegisterSession)
    private readonly _sessionRepo: Repository<RegisterSession>,
    private readonly _pagination: PaginationProvider,
  ) {}

  /** Record a transaction, auto-attaching it to the open register session. */
  async record(dto: CreateTransactionDto, userId?: string): Promise<Transaction> {
    const session = await this._sessionRepo.findOne({
      where: { status: 'open' },
      order: { openedAt: 'DESC' },
    });
    return this._repo.save(
      this._repo.create({
        type: dto.type as Transaction['type'],
        method: dto.method as Transaction['method'],
        amount: round2(dto.amount),
        orderId: dto.orderId ?? null,
        registerSessionId: session?.id ?? null,
        note: dto.note ?? null,
        createdBy: userId ?? null,
      }),
    );
  }

  getAll(query: GetTransactionQueryDto): Promise<Paginated<Transaction>> {
    const where: FindOptionsWhere<Transaction> = {};
    if (query.type) where.type = query.type as Transaction['type'];
    if (query.method) where.method = query.method as Transaction['method'];
    if (query.registerSessionId) where.registerSessionId = query.registerSessionId;

    if (query.from && query.to) {
      where.createdAt = Between(new Date(query.from), new Date(query.to));
    } else if (query.from) {
      where.createdAt = MoreThanOrEqual(new Date(query.from));
    } else if (query.to) {
      where.createdAt = LessThanOrEqual(new Date(query.to));
    }

    return this._pagination.paginationQuery(query, this._repo, where, ['order'], undefined, {
      createdAt: 'DESC',
    });
  }
}
