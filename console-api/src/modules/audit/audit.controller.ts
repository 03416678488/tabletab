import { Controller, Get, Query } from '@nestjs/common';

import { PlatformAdmin } from '@modules/auth/guards/platform-admin/platform-admin.decorator';
import { AuditService } from './audit.service';

@PlatformAdmin()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly _service: AuditService) {}

  @Get()
  list(
    @Query('action') action?: string,
    @Query('targetId') targetId?: string,
    @Query('limit') limit?: string,
  ) {
    return this._service.list({
      action,
      targetId,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
