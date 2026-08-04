import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';

import { KioskMachineService } from './kiosk-machine.service';
import {
  CreateKioskMachineDto,
  UpdateKioskMachineDto,
} from './dto/kiosk-machine.dto';

@Controller('kiosk-machines')
export class KioskMachineController {
  constructor(private readonly _service: KioskMachineService) {}

  @Get()
  getAll() {
    return this._service.getAll();
  }

  @Post()
  create(@Body() dto: CreateKioskMachineDto) {
    return this._service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateKioskMachineDto) {
    return this._service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this._service.remove(id);
  }
}
