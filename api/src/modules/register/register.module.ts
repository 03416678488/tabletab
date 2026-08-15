import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegisterSession } from './entities/register-session.entity';
import { Transaction } from '@modules/transaction/entities/transaction.entity';
import { Branch } from '@modules/branch/entities/branch.entity';
import { RegisterController } from './register.controller';
import { RegisterService } from './register.service';
import { ErrorModule } from '@modules/common/error/error.module';
import { NotificationModule } from '@modules/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RegisterSession, Transaction, Branch]),
    ErrorModule,
    NotificationModule,
  ],
  controllers: [RegisterController],
  providers: [RegisterService],
  exports: [RegisterService, TypeOrmModule],
})
export class RegisterModule {}
