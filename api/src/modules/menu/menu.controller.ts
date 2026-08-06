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
import { menuChannel } from '@modules/realtime/channels';
import { sseFromChannel } from '@modules/realtime/sse.util';

import { MenuService } from './menu.service';
import { MenuIoService } from './services/menu-io.service';
import { CreateMenuItemDto, UpdateMenuItemDto, GetMenuItemQueryDto } from './dto';
import { ImportMenuItemsDto } from './dto/import-menu-items.dto';

@Controller('menu-items')
export class MenuController {
  constructor(
    private readonly _menuService: MenuService,
    private readonly _ioService: MenuIoService,
    private readonly _realtime: RealtimeService,
  ) {}

  /** Export all items as CSV (staff only). Declared before `:id`. */
  @Get('export')
  exportCsv() {
    return this._ioService.exportCsv();
  }

  /** Bulk import items from CSV — upsert by id (staff only). */
  @Post('import')
  importCsv(@Body() dto: ImportMenuItemsDto) {
    return this._ioService.importCsv(dto.csv);
  }

  /**
   * Live menu-changed stream (availability / price / add / remove). Public — the
   * menu is public, so native `EventSource` works (no auth header needed). Events
   * just say "menu changed"; the client refetches to reconcile. Declared before
   * `:id` so `stream` isn't captured as an item id.
   */
  @Public()
  @Sse('stream')
  streamMenu(@CurrentTenant() tenant: TenantRecord | null): Observable<MessageEvent> {
    return sseFromChannel(this._realtime, menuChannel(tenant?.id));
  }

  // Public so the storefront can render menu items (e.g. the "Menu grid" block).
  @Public()
  @Get()
  getAll(@Query() query: GetMenuItemQueryDto) {
    return this._menuService.getAll(query);
  }

  @Public()
  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._menuService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateMenuItemDto) {
    return this._menuService.createMenuItem(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMenuItemDto) {
    return this._menuService.updateMenuItem(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._menuService.deleteMenuItem(id);
  }
}
