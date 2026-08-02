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

import { QrCodeService } from './qr-code.service';
import { CreateQrCodeDto, UpdateQrCodeDto, GetQrCodeQueryDto } from './dto';

@Controller('qr-codes')
export class QrCodeController {
  constructor(private readonly _qrCodeService: QrCodeService) {}

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
