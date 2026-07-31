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

import { BranchService } from './branch.service';
import { CreateBranchDto, UpdateBranchDto, GetBranchQueryDto } from './dto';

@Controller('branches')
export class BranchController {
  constructor(private readonly _branchService: BranchService) {}

  @Get()
  getAll(@Query() query: GetBranchQueryDto) {
    return this._branchService.getAll(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._branchService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this._branchService.createBranch(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBranchDto) {
    return this._branchService.updateBranch(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._branchService.deleteBranch(id);
  }
}
