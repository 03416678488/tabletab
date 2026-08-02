import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Transaction } from '@modules/transaction/entities/transaction.entity';
import { RegisterSession } from '@modules/register/entities/register-session.entity';

import { Expense } from './entities/expense.entity';
import { ExpenseCategory } from './entities/expense-category.entity';
import {
  CreateExpenseCategoryDto,
  CreateExpenseDto,
  UpdateExpenseCategoryDto,
  UpdateExpenseDto,
} from './dto/expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private readonly _repo: Repository<Expense>,
    @InjectRepository(ExpenseCategory)
    private readonly _catRepo: Repository<ExpenseCategory>,
    @InjectRepository(Transaction)
    private readonly _txnRepo: Repository<Transaction>,
    @InjectRepository(RegisterSession)
    private readonly _sessionRepo: Repository<RegisterSession>,
  ) {}

  /** Cash expense removes from the drawer: record a cash_out on the open register. */
  private async recordCashMovement(expense: Expense): Promise<void> {
    if ((expense.paymentType ?? '').toLowerCase() !== 'cash') return;
    const session = await this._sessionRepo.findOne({
      where: { status: 'open' },
      order: { openedAt: 'DESC' },
    });
    await this._txnRepo.save(
      this._txnRepo.create({
        type: 'cash_out',
        method: 'cash',
        amount: expense.amount,
        note: `Expense${expense.expenseFor ? `: ${expense.expenseFor}` : ''}`,
        registerSessionId: session?.id ?? null,
      }),
    );
  }

  // ── Records ──
  getAll(): Promise<Expense[]> {
    return this._repo.find({ relations: ['category'], order: { createdAt: 'DESC' } });
  }

  async getById(id: string): Promise<Expense> {
    const found = await this._repo.findOne({ where: { id }, relations: ['category'] });
    if (!found) throw new NotFoundException('Expense not found');
    return found;
  }

  async create(dto: CreateExpenseDto): Promise<Expense> {
    const saved = await this._repo.save(this._repo.create({ ...dto }));
    await this.recordCashMovement(saved);
    return this.getById(saved.id);
  }

  async update(id: string, dto: UpdateExpenseDto): Promise<Expense> {
    await this.getById(id);
    await this._repo.update(id, { ...dto });
    return this.getById(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.getById(id);
    await this._repo.delete(id);
    return { message: 'Expense deleted' };
  }

  // ── Categories ──
  getCategories(): Promise<ExpenseCategory[]> {
    return this._catRepo.find({ order: { name: 'ASC' } });
  }

  createCategory(dto: CreateExpenseCategoryDto): Promise<ExpenseCategory> {
    return this._catRepo.save(this._catRepo.create(dto));
  }

  async updateCategory(id: number, dto: UpdateExpenseCategoryDto): Promise<ExpenseCategory> {
    const cat = await this._catRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    await this._catRepo.update(id, dto);
    return this._catRepo.findOne({ where: { id } }) as Promise<ExpenseCategory>;
  }

  async removeCategory(id: number): Promise<{ message: string }> {
    await this._catRepo.delete(id);
    return { message: 'Category deleted' };
  }
}
