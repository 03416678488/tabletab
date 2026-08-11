import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '@cor/decorators/auth/current-user.decorator';
import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';

import { PurchaseOrderService } from './purchase-order.service';
import {
  CreatePurchaseOrderDto,
  GetPurchaseOrderQueryDto,
  UpdatePurchaseOrderDto,
} from './dto';

@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly _pos: PurchaseOrderService) {}

  @Get()
  getAll(@Query() query: GetPurchaseOrderQueryDto) {
    return this._pos.getAll(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._pos.getById(id);
  }

  @Post()
  create(
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this._pos.create(dto, user?.id ?? null);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this._pos.update(id, dto);
  }

  @Post(':id/receive')
  receive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this._pos.receive(id, user?.id ?? null);
  }

  @Post(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this._pos.cancel(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this._pos.remove(id);
  }
}
