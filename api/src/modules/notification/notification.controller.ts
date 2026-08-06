import {
  Controller,
  Get,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';

import { CurrentUser } from '@cor/decorators/auth/current-user.decorator';
import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { sseFromChannel } from '@modules/realtime/sse.util';
import { notifChannel } from '@modules/realtime/channels';

import { NotificationService } from './notification.service';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly _service: NotificationService,
    private readonly _realtime: RealtimeService,
  ) {}

  /**
   * Live per-user notification stream. Staff-authenticated (not `@Public`); the
   * global JWT guard populates `req.user`. Events just say "you have a new
   * notification" — the bell refetches the list + unread count to reconcile.
   */
  @Sse('stream')
  stream(@CurrentUser() user: AuthenticatedUser): Observable<MessageEvent> {
    return sseFromChannel(this._realtime, notifChannel(user.id));
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: GetNotificationsQueryDto) {
    return this._service.list(user.id, query);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this._service.unreadCount(user.id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this._service.markAllRead(user.id);
  }

  /** Mark all unread in one category read — used when a board "consumes" them. */
  @Patch('read-category/:category')
  markCategoryRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('category') category: string,
  ) {
    return this._service.markCategoryRead(user.id, category);
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this._service.markRead(user.id, id);
  }
}
