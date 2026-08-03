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

import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto, GetCategoryQueryDto } from './dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly _categoryService: CategoryService) {}

  // Public so the storefront can group the menu by category.
  @Public()
  @Get()
  getAll(@Query() query: GetCategoryQueryDto) {
    return this._categoryService.getAll(query);
  }

  @Public()
  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._categoryService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this._categoryService.createCategory(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this._categoryService.updateCategory(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._categoryService.deleteCategory(id);
  }
}
