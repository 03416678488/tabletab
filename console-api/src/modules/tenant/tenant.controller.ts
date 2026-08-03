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

import { PlatformAdmin } from '@modules/auth/guards/platform-admin/platform-admin.decorator';
import { TenantService } from './tenant.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  UpdateTenantStatusDto,
} from './dto/tenant.dto';

/**
 * Platform console — tenant registry.
 * Requires a logged-in **platform administrator** (global JwtAuthGuard for the
 * token, then PlatformAdminGuard for the super-admin check). Restaurant staff
 * tokens are rejected here.
 */
@PlatformAdmin()
@Controller('tenants')
export class TenantController {
  constructor(private readonly _service: TenantService) {}

  @Get()
  list() {
    return this._service.list();
  }

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this._service.create(dto);
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this._service.getById(id);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTenantDto) {
    return this._service.update(id, dto);
  }

  @Put(':id/status')
  setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantStatusDto,
  ) {
    return this._service.setStatus(id, dto);
  }

  /** Re-run provisioning (create the tenant database) — e.g. after a failure. */
  @Post(':id/provision')
  provision(@Param('id', ParseUUIDPipe) id: string) {
    return this._service.provision(id);
  }

  /** Delete the tenant and drop its database. Requires ?confirm=<handle>. */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Query('confirm') confirm?: string) {
    return this._service.remove(id, confirm);
  }
}
