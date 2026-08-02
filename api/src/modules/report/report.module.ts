import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from '@modules/order/entities/order.entity';
import { Transaction } from '@modules/transaction/entities/transaction.entity';
import { Income } from '@modules/income/entities/income.entity';
import { Expense } from '@modules/expense/entities/expense.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Transaction, Income, Expense])],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
