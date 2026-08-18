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
import { RequirePermission } from '@cor/decorators/authorization/require-permission.decorator';

import { Public } from '@modules/auth/guards/public/public.decorator';

import { LanguageService } from './language.service';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/language.dto';

@RequirePermission('settings')
@Controller('languages')
export class LanguageController {
  constructor(private readonly _service: LanguageService) {}

  @Public()
  @Get()
  getAll() {
    return this._service.getAll();
  }

  @Post()
  create(@Body() dto: CreateLanguageDto) {
    return this._service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLanguageDto,
  ) {
    return this._service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this._service.remove(id);
  }
}
