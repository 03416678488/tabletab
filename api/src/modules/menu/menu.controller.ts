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

import { MenuService } from './menu.service';
import { CreateMenuItemDto, UpdateMenuItemDto, GetMenuItemQueryDto } from './dto';

@Controller('menu-items')
export class MenuController {
  constructor(private readonly _menuService: MenuService) {}

  @Get()
  getAll(@Query() query: GetMenuItemQueryDto) {
    return this._menuService.getAll(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._menuService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateMenuItemDto) {
    return this._menuService.createMenuItem(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMenuItemDto) {
    return this._menuService.updateMenuItem(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._menuService.deleteMenuItem(id);
  }
}
