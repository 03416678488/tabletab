import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';

import { TransactionService } from './transaction.service';
import {
  CreateTransactionDto,
  GetTransactionQueryDto,
} from './dto/transaction.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly _service: TransactionService) {}

  @Get()
  getAll(@Query() query: GetTransactionQueryDto) {
    return this._service.getAll(query);
  }

  /** Aggregated totals for the current filter (declared before `:id`). */
  @Get('summary')
  summary(@Query() query: GetTransactionQueryDto) {
    return this._service.summary(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._service.getById(id);
  }

  @Post()
  create(
    @Body() dto: CreateTransactionDto,
    @Req() req: { user?: AuthenticatedUser },
  ) {
    return this._service.record(dto, req.user?.id);
  }
}
