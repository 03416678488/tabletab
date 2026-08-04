import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Expense } from './entities/expense.entity';
import { ExpenseCategory } from './entities/expense-category.entity';
import { Transaction } from '@modules/transaction/entities/transaction.entity';
import { RegisterSession } from '@modules/register/entities/register-session.entity';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, ExpenseCategory, Transaction, RegisterSession]),
  ],
  controllers: [ExpenseController],
  providers: [
    ExpenseService,
    tenantRepositoryProvider(Expense),
    tenantRepositoryProvider(ExpenseCategory),
    tenantRepositoryProvider(Transaction),
    tenantRepositoryProvider(RegisterSession),
  ],
  exports: [ExpenseService, TypeOrmModule],
})
export class ExpenseModule {}
