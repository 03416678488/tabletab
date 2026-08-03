import { Body, Controller, Get, Headers, Post, Put } from '@nestjs/common';

import { Public } from '@modules/auth/guards/public/public.decorator';

import { CustomerAuthService } from './customer-auth.service';
import {
  CustomerLoginDto,
  CustomerRegisterDto,
  CustomerUpdateProfileDto,
} from './dto';

/**
 * Storefront customer accounts. All routes are `@Public()` (the global staff
 * JWT guard doesn't apply); the bearer token issued here is verified in-service.
 */
@Controller('customer-auth')
export class CustomerAuthController {
  constructor(private readonly _auth: CustomerAuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: CustomerRegisterDto) {
    return this._auth.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: CustomerLoginDto) {
    return this._auth.login(dto);
  }

  @Public()
  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    return this._auth.getProfile(this._auth.verifyCustomerId(authorization));
  }

  @Public()
  @Put('me')
  updateMe(
    @Body() dto: CustomerUpdateProfileDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this._auth.updateProfile(this._auth.verifyCustomerId(authorization), dto);
  }
}
