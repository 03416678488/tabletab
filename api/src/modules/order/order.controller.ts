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

import { Public } from '@modules/auth/guards/public/public.decorator';

import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderDto, GetOrderQueryDto } from './dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly _orderService: OrderService) {}

  @Get()
  getAll(@Query() query: GetOrderQueryDto) {
    return this._orderService.getAll(query);
  }

  @Get('table-stats')
  getTableStats() {
    return this._orderService.getTableStats();
  }

  @Get('board')
  getBoard() {
    return this._orderService.getBoard();
  }

  /** The active/open order for a table (POS load-to-edit), or null. */
  @Get('by-table/:tableId')
  getByTable(@Param('tableId', ParseUUIDPipe) tableId: string) {
    return this._orderService.getActiveByTable(tableId);
  }

  // Public so a storefront customer can track their order by id (UUID = unguessable).
  @Public()
  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._orderService.getById(id);
  }

  // Public so the storefront can place online orders (guest or signed-in customer).
  @Public()
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this._orderService.createOrder(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrderDto) {
    return this._orderService.updateOrder(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._orderService.deleteOrder(id);
  }
}
