import { Module } from '@nestjs/common';
import { TransactionService } from 'src/services/transaction.service';

@Module({
  providers: [TransactionService],
  exports: [TransactionService],
})
export class ServicesCommonModule {}
