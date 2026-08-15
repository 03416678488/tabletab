import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from '@modules/order/entities/order.entity';
import { Transaction } from '@modules/transaction/entities/transaction.entity';
import { Branch } from '@modules/branch/entities/branch.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Transaction, Branch])],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
