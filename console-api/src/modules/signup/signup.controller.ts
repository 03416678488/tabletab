import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { Public } from '@modules/auth/guards/public/public.decorator';
import { SignupService } from './signup.service';
import { SignupDto } from './dto/signup.dto';

/**
 * Public self-serve onboarding. A prospective restaurant owner provisions their
 * own tenant (database cloned from the template) and is made its first admin — no
 * platform-admin involvement. The tenant is reachable at its subdomain instantly.
 */
@Controller('signup')
export class SignupController {
  constructor(private readonly _service: SignupService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: SignupDto) {
    return this._service.signup(dto);
  }
}
