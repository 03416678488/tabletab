import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';

import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';

import { TransactionService } from './transaction.service';
import { CreateTransactionDto, GetTransactionQueryDto } from './dto/transaction.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly _service: TransactionService) {}

  @Get()
  getAll(@Query() query: GetTransactionQueryDto) {
    return this._service.getAll(query);
  }

  @Post()
  create(
    @Body() dto: CreateTransactionDto,
    @Req() req: { user?: AuthenticatedUser },
  ) {
    return this._service.record(dto, req.user?.id);
  }
}
