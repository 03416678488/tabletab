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

import { EventTypeService } from './event-type.service';
import {
  CreateEventTypeDto,
  UpdateEventTypeDto,
  GetEventTypeQueryDto,
} from './dto';

@Controller('event-types')
export class EventTypeController {
  constructor(private readonly _eventTypeService: EventTypeService) {}

  // Public so the storefront can list bookable event types.
  @Public()
  @Get()
  getAll(@Query() query: GetEventTypeQueryDto) {
    return this._eventTypeService.getAll(query);
  }

  @Public()
  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._eventTypeService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateEventTypeDto) {
    return this._eventTypeService.createEventType(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventTypeDto,
  ) {
    return this._eventTypeService.updateEventType(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._eventTypeService.deleteEventType(id);
  }
}
