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
import { RequiresFeature } from '@modules/tenancy/plan-feature.guard';

import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsDto, UpdateAnalyticsDto } from './dto/analytics.dto';

@RequirePermission('settings')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly _service: AnalyticsService) {}

  @Public()
  @RequiresFeature('analytics')
  @Get()
  getAll() {
    return this._service.getAll();
  }

  @Post()
  create(@Body() dto: CreateAnalyticsDto) {
    return this._service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAnalyticsDto,
  ) {
    return this._service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this._service.remove(id);
  }
}
