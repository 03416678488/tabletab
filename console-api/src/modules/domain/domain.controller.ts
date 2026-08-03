import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { PlatformAdmin } from '@modules/auth/guards/platform-admin/platform-admin.decorator';
import { Audit } from '@modules/audit/audit.decorator';
import { DomainService } from './domain.service';
import { AddDomainDto } from './dto/domain.dto';

/**
 * Custom-domain management for the platform console. Requires a platform admin.
 * A domain is added in the `pending` state with a DNS TXT challenge; once the
 * customer publishes the record and verification passes, the hostname is copied
 * onto the tenant so host→tenant routing recognises it.
 */
@PlatformAdmin()
@Controller()
export class DomainController {
  constructor(private readonly _service: DomainService) {}

  @Get('tenants/:tenantId/domains')
  list(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this._service.list(tenantId);
  }

  @Post('tenants/:tenantId/domains')
  @Audit('domain.add', 'domain')
  add(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: AddDomainDto,
  ) {
    return this._service.add(tenantId, dto);
  }

  /** Run the DNS TXT check now and update the domain's status. */
  @Post('domains/:id/verify')
  @Audit('domain.verify', 'domain')
  verify(@Param('id', ParseUUIDPipe) id: string) {
    return this._service.verify(id);
  }

  @Delete('domains/:id')
  @Audit('domain.remove', 'domain')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this._service.remove(id);
  }
}
