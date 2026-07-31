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

import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto, GetStaffQueryDto } from './dto';

@Controller('staff')
export class StaffController {
  constructor(private readonly _staffService: StaffService) {}

  @Get()
  getAll(@Query() query: GetStaffQueryDto) {
    return this._staffService.getAll(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._staffService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateStaffDto) {
    return this._staffService.createStaff(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaffDto) {
    return this._staffService.updateStaff(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._staffService.deleteStaff(id);
  }
}
