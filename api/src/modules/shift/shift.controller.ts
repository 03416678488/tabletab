import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';

import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';

import { ShiftService } from './shift.service';
import { ClockInDto } from './dto/shift.dto';

@Controller('shifts')
export class ShiftController {
  constructor(private readonly _service: ShiftService) {}

  /** The caller's current open shift (null when off duty). */
  @Get('current')
  current(@Req() req: { user?: AuthenticatedUser }) {
    return this._service.getCurrent(req.user?.id ?? '');
  }

  @Get('history')
  history(@Req() req: { user?: AuthenticatedUser }) {
    return this._service.history(req.user?.id ?? '');
  }

  /** Everyone currently on shift (optionally in a branch) — for an admin board. */
  @Get('on-shift')
  onShift(@Query('branchId') branchId?: string) {
    return this._service.onShift(branchId);
  }

  @Post('clock-in')
  clockIn(@Body() dto: ClockInDto, @Req() req: { user?: AuthenticatedUser }) {
    return this._service.clockIn(req.user?.id ?? '', dto);
  }

  @Post('clock-out')
  clockOut(@Req() req: { user?: AuthenticatedUser }) {
    return this._service.clockOut(req.user?.id ?? '');
  }
}
