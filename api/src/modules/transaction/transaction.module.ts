import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Transaction } from './entities/transaction.entity';
import { RegisterSession } from '@modules/register/entities/register-session.entity';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { NotificationModule } from '@modules/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, RegisterSession]),
    PaginationModule,
    NotificationModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService, TypeOrmModule],
})
export class TransactionModule {}
