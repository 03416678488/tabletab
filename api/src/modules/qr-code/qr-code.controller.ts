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

import { QrCodeService } from './qr-code.service';
import { CreateQrCodeDto, UpdateQrCodeDto, GetQrCodeQueryDto } from './dto';
import { CreateTableOrderDto } from './dto/create-table-order.dto';

@Controller('qr-codes')
export class QrCodeController {
  constructor(private readonly _qrCodeService: QrCodeService) {}

  /**
   * Public — a customer scans `/t/{slug}`; the storefront resolves it here to the
   * table + branch to start a dine-in session. Declared before `:id` so the
   * static `resolve` segment isn't captured as an id.
   */
  @Public()
  @Get('resolve/:slug')
  resolve(@Param('slug') slug: string) {
    return this._qrCodeService.resolveBySlug(slug);
  }

  /** Public — a guest taps "Call waiter" at the table; alerts branch staff. */
  @Public()
  @Post('call-waiter/:slug')
  callWaiter(@Param('slug') slug: string) {
    return this._qrCodeService.callWaiter(slug);
  }

  /**
   * Public — place a dine-in order from a scanned table QR. The table + branch
   * are taken from the slug (never the body), and every item is re-priced
   * server-side, so a guest can only choose *what* to order.
   */
  @Public()
  @Post(':slug/orders')
  createOrder(@Param('slug') slug: string, @Body() dto: CreateTableOrderDto) {
    return this._qrCodeService.createTableOrder(slug, dto);
  }

  @Get()
  getAll(@Query() query: GetQrCodeQueryDto) {
    return this._qrCodeService.getAll(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._qrCodeService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateQrCodeDto) {
    return this._qrCodeService.createQrCode(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateQrCodeDto) {
    return this._qrCodeService.updateQrCode(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._qrCodeService.deleteQrCode(id);
  }
}
