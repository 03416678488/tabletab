import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';

import { IncomeService } from './income.service';
import {
  CreateIncomeCategoryDto,
  CreateIncomeDto,
  UpdateIncomeCategoryDto,
  UpdateIncomeDto,
} from './dto/income.dto';

@Controller('incomes')
export class IncomeController {
  constructor(private readonly _service: IncomeService) {}

  @Get('categories')
  getCategories() {
    return this._service.getCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateIncomeCategoryDto) {
    return this._service.createCategory(dto);
  }

  @Put('categories/:id')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIncomeCategoryDto,
  ) {
    return this._service.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id', ParseIntPipe) id: number) {
    return this._service.removeCategory(id);
  }

  @Get()
  getAll() {
    return this._service.getAll();
  }

  @Post()
  create(@Body() dto: CreateIncomeDto) {
    return this._service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateIncomeDto) {
    return this._service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this._service.remove(id);
  }
}
