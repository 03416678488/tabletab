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

  /** Public — the table's running order (bill), or null. */
  @Public()
  @Get('bill/:slug')
  bill(@Param('slug') slug: string) {
    return this._qrCodeService.getBill(slug);
  }

  /** Public — a guest is ready to pay; alerts branch staff to bring the bill. */
  @Public()
  @Post('request-bill/:slug')
  requestBill(@Param('slug') slug: string) {
    return this._qrCodeService.requestBill(slug);
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
