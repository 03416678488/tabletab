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

import { MenusService } from './menus.service';
import { CreateMenuDto, UpdateMenuDto, GetMenuQueryDto } from './dto';

@Controller('menus')
export class MenusController {
  constructor(private readonly _menusService: MenusService) {}

  @Get()
  getAll(@Query() query: GetMenuQueryDto) {
    return this._menusService.getAll(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._menusService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateMenuDto) {
    return this._menusService.createMenu(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMenuDto) {
    return this._menusService.updateMenu(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._menusService.deleteMenu(id);
  }
}
