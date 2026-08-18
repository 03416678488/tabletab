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
import { RequirePermission } from '@cor/decorators/authorization/require-permission.decorator';

import { CategoryService } from './category.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  GetCategoryQueryDto,
} from './dto';
import { BulkActiveDto, BulkIdsDto } from '@modules/common/dto/bulk.dto';

// Reads are @Public (storefront + POS); the guard skips those, so only the
// mutations below are gated on the `categories` module.
@RequirePermission('categories')
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

  @Post('bulk-delete')
  bulkDelete(@Body() dto: BulkIdsDto) {
    return this._categoryService.bulkDelete(dto.ids);
  }

  @Post('bulk-active')
  bulkActive(@Body() dto: BulkActiveDto) {
    return this._categoryService.bulkSetActive(dto.ids, dto.isActive);
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this._categoryService.createCategory(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this._categoryService.updateCategory(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._categoryService.deleteCategory(id);
  }
}
