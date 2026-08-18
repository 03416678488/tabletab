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
import { RequirePermission } from '@cor/decorators/authorization/require-permission.decorator';

import { Public } from '@modules/auth/guards/public/public.decorator';

import { TimeSlotService } from './time-slot.service';
import { CreateTimeSlotDto, UpdateTimeSlotDto } from './dto/time-slot.dto';

@RequirePermission('reservations')
@Controller('time-slots')
export class TimeSlotController {
  constructor(private readonly _service: TimeSlotService) {}

  @Public()
  @Get()
  getAll() {
    return this._service.getAll();
  }

  @Post()
  create(@Body() dto: CreateTimeSlotDto) {
    return this._service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTimeSlotDto,
  ) {
    return this._service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this._service.remove(id);
  }
}
