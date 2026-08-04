import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';

import { Public } from '@modules/auth/guards/public/public.decorator';

import { TaxGroupService } from './tax-group.service';
import { CreateTaxGroupDto, UpdateTaxGroupDto } from './dto/tax-group.dto';

@Controller('tax-groups')
export class TaxGroupController {
  constructor(private readonly _service: TaxGroupService) {}

  @Public()
  @Get()
  getAll() {
    return this._service.getAll();
  }

  @Post()
  create(@Body() dto: CreateTaxGroupDto) {
    return this._service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaxGroupDto) {
    return this._service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this._service.remove(id);
  }
}
