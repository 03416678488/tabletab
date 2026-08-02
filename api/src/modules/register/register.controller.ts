import { Body, Controller, Get, Post, Req } from '@nestjs/common';

import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';

import { RegisterService } from './register.service';
import { CashMovementDto, CloseRegisterDto, OpenRegisterDto } from './dto/register.dto';

@Controller('register')
export class RegisterController {
  constructor(private readonly _service: RegisterService) {}

  @Get('current')
  current() {
    return this._service.getCurrent();
  }

  @Get('sessions')
  sessions() {
    return this._service.listSessions();
  }

  @Post('open')
  open(@Body() dto: OpenRegisterDto, @Req() req: { user?: AuthenticatedUser }) {
    return this._service.open(dto, req.user?.id);
  }

  @Post('close')
  close(@Body() dto: CloseRegisterDto, @Req() req: { user?: AuthenticatedUser }) {
    return this._service.close(dto, req.user?.id);
  }

  @Post('cash')
  cash(@Body() dto: CashMovementDto, @Req() req: { user?: AuthenticatedUser }) {
    return this._service.addCash(dto, req.user?.id);
  }
}
