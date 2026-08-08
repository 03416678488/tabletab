import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
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

  // Public so the storefront can group the menu by category. `x-lang` (set by
  // the client from the active locale) overlays translated text.
  @Public()
  @Get()
  getAll(@Query() query: GetCategoryQueryDto, @Headers('x-lang') lang?: string) {
    return this._categoryService.getAll(query, lang);
  }

  @Public()
  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string, @Headers('x-lang') lang?: string) {
    return this._categoryService.getById(id, lang);
  }

  // Create/update read/write in the caller's active language (`x-lang`): in a
  // non-default language, name/description are saved as that language's
  // translation, leaving the base row as the fallback.
  @Post()
  create(@Body() dto: CreateCategoryDto, @Headers('x-lang') lang?: string) {
    return this._categoryService.createCategory(dto, lang);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @Headers('x-lang') lang?: string,
  ) {
    return this._categoryService.updateCategory(id, dto, lang);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._categoryService.deleteCategory(id);
  }
}
