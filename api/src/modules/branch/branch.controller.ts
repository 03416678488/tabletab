import {
  Body,
  Controller,
  Delete,
  Get,
  type MessageEvent,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Sse,
} from '@nestjs/common';
import { type Observable } from 'rxjs';

import { Public } from '@modules/auth/guards/public/public.decorator';
import { CurrentTenant } from '@modules/tenancy/current-tenant.decorator';
import { TenantRecord } from '@modules/tenancy/tenancy.types';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { branchesChannel } from '@modules/realtime/channels';
import { sseFromChannel } from '@modules/realtime/sse.util';
import { BranchService } from './branch.service';
import { CreateBranchDto, UpdateBranchDto, GetBranchQueryDto } from './dto';

@Controller('branches')
export class BranchController {
  constructor(
    private readonly _branchService: BranchService,
    private readonly _realtime: RealtimeService,
  ) {}

  /**
   * Live branch stream — open/closed, online ordering, delivery/pickup flags.
   * Public (branches are public); native `EventSource` on the storefront. Events
   * say "a branch changed"; the client refetches to reconcile. Declared before
   * `:id` so `stream` isn't captured as a branch id.
   */
  @Public()
  @Sse('stream')
  streamBranches(@CurrentTenant() tenant: TenantRecord | null): Observable<MessageEvent> {
    return sseFromChannel(this._realtime, branchesChannel(tenant?.id));
  }

  // Public so the storefront can list branches and resolve the nearest one.
  @Public()
  @Get()
  getAll(@Query() query: GetBranchQueryDto) {
    return this._branchService.getAll(query);
  }

  @Public()
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
