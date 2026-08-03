import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { GetPermissionQueryDto } from './dto/get-permission-query.dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async getAll(@Query() query: GetPermissionQueryDto) {
    return this.permissionsService.getAll(query);
  }

  @Get(':id')
  async getPermissionById(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.getPermissionById(id);
  }

  @Get('search/:query')
  async searchPermissions(@Param('query') query: string) {
    return this.permissionsService.searchPermissions(query);
  }

  @Get('resources/list')
  async getAllResources() {
    return this.permissionsService.getAllResources();
  }

  @Get('actions/list')
  async getValidActions() {
    return this.permissionsService.getAllValidActions();
  }

  @Get('count')
  async getPermissionCount() {
    return {
      count: await this.permissionsService.getPermissionCount(),
    };
  }

  @Get('export')
  async exportPermissions() {
    return this.permissionsService.exportPermissions();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPermission(@Body() createDto: CreatePermissionDto) {
    return this.permissionsService.createPermission(createDto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async createBulkPermissions(@Body() createDtos: CreatePermissionDto[]) {
    return this.permissionsService.createBulkPermissions(createDtos);
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  async importPermissions(@Body() permissions: CreatePermissionDto[]) {
    return this.permissionsService.importPermissions(permissions);
  }

  @Patch(':id')
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.updatePermission(id, updateDto);
  }

  @Patch('bulk')
  async updateBulkPermissions(@Body() updates: Array<{ id: number; data: UpdatePermissionDto }>) {
    return this.permissionsService.updateBulkPermissions(updates);
  }

  @Patch(':id/actions/add')
  async addActionToPermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() { action }: { action: string },
  ) {
    return this.permissionsService.addActionToPermission(id, action);
  }

  @Patch(':id/actions/remove')
  async removeActionFromPermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() { action }: { action: string },
  ) {
    return this.permissionsService.removeActionFromPermission(id, action);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePermission(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.deletePermission(id);
  }

  @Delete('bulk')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBulkPermissions(@Body() { ids }: { ids: number[] }) {
    return this.permissionsService.deleteBulkPermissions(ids);
  }

  @Delete('all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllPermissions() {
    return this.permissionsService.deleteAllPermissions();
  }
}
