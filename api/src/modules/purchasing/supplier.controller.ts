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

import { SupplierService } from './supplier.service';
import {
  CreateSupplierDto,
  GetSupplierQueryDto,
  UpdateSupplierDto,
} from './dto';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly _suppliers: SupplierService) {}

  @Get()
  getAll(@Query() query: GetSupplierQueryDto) {
    return this._suppliers.getAll(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._suppliers.getById(id);
  }

  @Post()
  create(@Body() dto: CreateSupplierDto) {
    return this._suppliers.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this._suppliers.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this._suppliers.remove(id);
  }
}
