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

import { TableService } from './table.service';
import { CreateTableDto, UpdateTableDto, GetTableQueryDto } from './dto';

@Controller('tables')
export class TableController {
  constructor(private readonly _tableService: TableService) {}

  @Get()
  getAll(@Query() query: GetTableQueryDto) {
    return this._tableService.getAll(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._tableService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateTableDto) {
    return this._tableService.createTable(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTableDto) {
    return this._tableService.updateTable(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._tableService.deleteTable(id);
  }
}
