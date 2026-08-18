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
import { RequirePermission } from '@cor/decorators/authorization/require-permission.decorator';

import { AreaService } from './area.service';
import { CreateAreaDto, UpdateAreaDto, GetAreaQueryDto } from './dto';

@RequirePermission('areas')
@Controller('areas')
export class AreaController {
  constructor(private readonly _areaService: AreaService) {}

  @Get()
  getAll(@Query() query: GetAreaQueryDto) {
    return this._areaService.getAll(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._areaService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateAreaDto) {
    return this._areaService.createArea(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAreaDto) {
    return this._areaService.updateArea(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._areaService.deleteArea(id);
  }
}
