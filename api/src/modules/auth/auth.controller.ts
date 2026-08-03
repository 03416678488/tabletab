import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';

import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth/refresh-auth.guard';
import { PlatformKeyGuard } from './guards/platform-key/platform-key.guard';
import { ImpersonateDto } from './dto/impersonate.dto';

import { Public } from '@modules/auth/guards/public/public.decorator';
import { CurrentUser } from '@cor/decorators/auth/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';

import { User } from '@modules/user/entities/users.entity';

import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestEmailVerificationDto } from './dto/request-email-verification.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordVerifyCodeDto } from './dto/reset-password-verify-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { UserRegisterDto } from './dto/user-register.dto';

import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly _authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  // @RateLimit(RateLimitConstants.LOGIN)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: any) {
    return this._authService.login(req);
  }

  /** Platform-only: mint a short-lived, tenant-bound token to view as a tenant. */
  @Public()
  @UseGuards(PlatformKeyGuard)
  @Post('impersonate')
  @HttpCode(HttpStatus.OK)
  async impersonate(@Body() dto: ImpersonateDto) {
    return this._authService.impersonate(dto);
  }

  @Public()
  // @RateLimit(RateLimitConstants.IP_LIMIT)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Req() req: any, @Body() dto: UserRegisterDto) {
    return this._authService.register(dto, req.tenantDataSource);
  }

  @Public()
  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req: any) {
    return this._authService.refreshToken(req.user.id, req.user.tenant, req.tenantDataSource);
  }

  @Public()
  // @RateLimit(RateLimitConstants.EMAIL_COOLDOWN)
  @Post('password-reset/request-code')
  @HttpCode(HttpStatus.OK)
  async requestPasswordResetCode(@Req() req: any, @Body() dto: RequestPasswordResetDto) {
    return this._authService.requestPasswordResetCode(dto, req.tenantDataSource);
  }

  @Public()
  // @RateLimit(RateLimitConstants.EMAIL_DAILY)
  @Post('password-reset/verify-code')
  @HttpCode(HttpStatus.OK)
  async verifyPasswordResetCode(@Req() req: any, @Body() dto: ResetPasswordVerifyCodeDto) {
    return this._authService.verifyPasswordResetCode(dto, req.tenantDataSource);
  }

  @Public()
  // @RateLimit(RateLimitConstants.EMAIL_DAILY)
  @Post('password-reset/verify-code-and-reset-password')
  @HttpCode(HttpStatus.OK)
  async verifyCodeAndResetPassword(@Req() req: any, @Body() dto: ResetPasswordDto) {
    return this._authService.verifyPasswordResetCodeAndReset(dto, req.tenantDataSource);
  }

  @Public()
  // @RateLimit(RateLimitConstants.EMAIL_COOLDOWN)
  @Post('email-verification/request-code')
  @HttpCode(HttpStatus.OK)
  async requestEmailVerificationCode(@Req() req: any, @Body() dto: RequestEmailVerificationDto) {
    return this._authService.requestEmailVerificationCode(dto, req.tenantDataSource);
  }

  @Public()
  @Post('email-verification/verify-code')
  @HttpCode(HttpStatus.OK)
  async verifyEmailWithCode(@Req() req: any, @Body() dto: VerifyEmailDto) {
    return this._authService.verifyEmailWithCode(dto, req.tenantDataSource);
  }

  @UseGuards(JwtAuthGuard)
  // @RateLimit(RateLimitConstants.EMAIL_COOLDOWN)
  @Post('email-verification/resend-code')
  @HttpCode(HttpStatus.OK)
  async resendVerificationCode(@Req() req: any, @CurrentUser() user: User) {
    return this._authService.requestEmailVerificationCode(
      { email: user.email },
      req.tenantDataSource,
    );
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: any,
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ) {
    return this._authService.changePassword(user.id, dto, req.tenantDataSource);
  }
}
