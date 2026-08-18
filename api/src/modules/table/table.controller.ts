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
import { RequirePermission } from '@cor/decorators/authorization/require-permission.decorator';
import { type Observable } from 'rxjs';

import { CurrentTenant } from '@modules/tenancy/current-tenant.decorator';
import { TenantRecord } from '@modules/tenancy/tenancy.types';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { tablesChannel } from '@modules/realtime/channels';
import { sseFromChannel } from '@modules/realtime/sse.util';

import { TableService } from './table.service';
import { CreateTableDto, UpdateTableDto, GetTableQueryDto } from './dto';

@RequirePermission('tables')
@Controller('tables')
export class TableController {
  constructor(
    private readonly _tableService: TableService,
    private readonly _realtime: RealtimeService,
  ) {}

  /**
   * Live floor stream: table CRUD + order-driven occupancy. Staff-only (guarded,
   * not `@Public()`) — the client sends the bearer token via a fetch-based stream.
   * Events just say "tables changed"; the floor refetches to reconcile. Declared
   * before `:id` so `stream` isn't captured as a table id.
   */
  @Sse('stream')
  streamTables(
    @CurrentTenant() tenant: TenantRecord | null,
  ): Observable<MessageEvent> {
    return sseFromChannel(this._realtime, tablesChannel(tenant?.id));
  }

  @Get()
  getAll(@Query() query: GetTableQueryDto) {
    return this._tableService.getAll(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._tableService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateTableDto) {
    return this._tableService.createTable(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTableDto) {
    return this._tableService.updateTable(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._tableService.deleteTable(id);
  }
}
