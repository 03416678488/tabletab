import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { Public } from '@modules/auth/guards/public/public.decorator';

import { TaxService } from './tax.service';
import { CreateTaxDto, UpdateTaxDto } from './dto/tax.dto';

@Controller('taxes')
export class TaxController {
  constructor(private readonly _service: TaxService) {}

  @Public()
  @Get()
  getAll(@Query('branchId') branchId?: string) {
    return this._service.getAll(branchId);
  }

  @Post()
  create(@Body() dto: CreateTaxDto) {
    return this._service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaxDto) {
    return this._service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this._service.remove(id);
  }
}
