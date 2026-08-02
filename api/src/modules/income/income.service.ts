import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Transaction } from '@modules/transaction/entities/transaction.entity';
import { RegisterSession } from '@modules/register/entities/register-session.entity';

import { Income } from './entities/income.entity';
import { IncomeCategory } from './entities/income-category.entity';
import {
  CreateIncomeCategoryDto,
  CreateIncomeDto,
  UpdateIncomeCategoryDto,
  UpdateIncomeDto,
} from './dto/income.dto';

@Injectable()
export class IncomeService {
  constructor(
    @InjectRepository(Income)
    private readonly _repo: Repository<Income>,
    @InjectRepository(IncomeCategory)
    private readonly _catRepo: Repository<IncomeCategory>,
    @InjectRepository(Transaction)
    private readonly _txnRepo: Repository<Transaction>,
    @InjectRepository(RegisterSession)
    private readonly _sessionRepo: Repository<RegisterSession>,
  ) {}

  /** Cash income adds to the drawer: record a cash_in on the open register. */
  private async recordCashMovement(income: Income): Promise<void> {
    if ((income.paymentType ?? '').toLowerCase() !== 'cash') return;
    const session = await this._sessionRepo.findOne({
      where: { status: 'open' },
      order: { openedAt: 'DESC' },
    });
    await this._txnRepo.save(
      this._txnRepo.create({
        type: 'cash_in',
        method: 'cash',
        amount: income.amount,
        note: `Income${income.incomeFor ? `: ${income.incomeFor}` : ''}`,
        registerSessionId: session?.id ?? null,
      }),
    );
  }

  // ── Records ──
  getAll(): Promise<Income[]> {
    return this._repo.find({ relations: ['category'], order: { createdAt: 'DESC' } });
  }

  async getById(id: string): Promise<Income> {
    const found = await this._repo.findOne({ where: { id }, relations: ['category'] });
    if (!found) throw new NotFoundException('Income not found');
    return found;
  }

  async create(dto: CreateIncomeDto): Promise<Income> {
    const saved = await this._repo.save(this._repo.create({ ...dto }));
    await this.recordCashMovement(saved);
    return this.getById(saved.id);
  }

  async update(id: string, dto: UpdateIncomeDto): Promise<Income> {
    await this.getById(id);
    await this._repo.update(id, { ...dto });
    return this.getById(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.getById(id);
    await this._repo.delete(id);
    return { message: 'Income deleted' };
  }

  // ── Categories ──
  getCategories(): Promise<IncomeCategory[]> {
    return this._catRepo.find({ order: { name: 'ASC' } });
  }

  createCategory(dto: CreateIncomeCategoryDto): Promise<IncomeCategory> {
    return this._catRepo.save(this._catRepo.create(dto));
  }

  async updateCategory(id: number, dto: UpdateIncomeCategoryDto): Promise<IncomeCategory> {
    const cat = await this._catRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    await this._catRepo.update(id, dto);
    return this._catRepo.findOne({ where: { id } }) as Promise<IncomeCategory>;
  }

  async removeCategory(id: number): Promise<{ message: string }> {
    await this._catRepo.delete(id);
    return { message: 'Category deleted' };
  }
}
