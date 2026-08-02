import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Income } from './entities/income.entity';
import { IncomeCategory } from './entities/income-category.entity';
import { Transaction } from '@modules/transaction/entities/transaction.entity';
import { RegisterSession } from '@modules/register/entities/register-session.entity';
import { IncomeController } from './income.controller';
import { IncomeService } from './income.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Income, IncomeCategory, Transaction, RegisterSession]),
  ],
  controllers: [IncomeController],
  providers: [IncomeService],
  exports: [IncomeService, TypeOrmModule],
})
export class IncomeModule {}
