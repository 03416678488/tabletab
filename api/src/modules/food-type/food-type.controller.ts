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

import { FoodTypeService } from './food-type.service';
import {
  CreateFoodTypeDto,
  UpdateFoodTypeDto,
  GetFoodTypeQueryDto,
} from './dto';

@Controller('food-types')
export class FoodTypeController {
  constructor(private readonly _foodTypeService: FoodTypeService) {}

  @Get()
  getAll(@Query() query: GetFoodTypeQueryDto) {
    return this._foodTypeService.getAll(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._foodTypeService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateFoodTypeDto) {
    return this._foodTypeService.createFoodType(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFoodTypeDto,
  ) {
    return this._foodTypeService.updateFoodType(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._foodTypeService.deleteFoodType(id);
  }
}
