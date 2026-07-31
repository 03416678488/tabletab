import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import {
  Inject,
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  BaseUserResponse,
  FormattedRoles,
  LoginResponse,
  PasswordResetResponse,
  RefreshTokenResponse,
  RegistrationResponse,
} from './types/types';

import { AuthJwtPayload } from './types/auth-jwtPayload';
import refreshJwtConfig from './config/refresh-jwt.config';
import { UserRolePermissions } from '@modules/role/entities/user-role-permissions.entity';

import { AUTH_CONSTANTS, AUTH_MESSAGES } from './constants';

import { toLowerCase, trimSpaces } from '@cor/helpers';

import { RequestEmailVerificationDto } from './dto/request-email-verification.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordVerifyCodeDto } from './dto/reset-password-verify-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRegisterDto } from './dto/user-register.dto';

import { UserService } from 'src/modules/user/user.service';
import { MailService } from '@modules/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(refreshJwtConfig.KEY)
    private _refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
    private _userService: UserService,
    private _jwtService: JwtService,
    private readonly _mailService: MailService,
    private readonly _configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this._userService.attemptLogin(email);

    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(AUTH_MESSAGES.USER_NOT_ACTIVE);
    }

    if (user.isDeleted) {
      throw new UnauthorizedException(AUTH_MESSAGES.USER_DELETED);
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(AUTH_MESSAGES.USER_EMAIL_NOT_VERIFIED);
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: this.getFormattedRoles(await user.userRolePermissions),
    };
  }

  async login(request: { user: BaseUserResponse }): Promise<LoginResponse> {
    const { user } = request;
    const payload = this.buildJwtPayload(user);
    const tokens = this.generateTokens(payload);

    return {
      ...user,
      tokens: {
        ...tokens,
      },
    };
  }

  async register(dto: UserRegisterDto): Promise<RegistrationResponse> {
    await this.isEmailExist(dto.email);
    await this.isPhoneNumberExist(dto.phoneNumber);

    const user = await this._userService.createUser({
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
      email: trimSpaces(toLowerCase(dto.email)),
      password: dto.password,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      roles: this.formatRoles(await user.userRolePermissions),
    };
  }

  async refreshToken(userId: string): Promise<RefreshTokenResponse> {
    const user = await this._userService.findOneWithRoles(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = this.buildJwtPayload({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return {
      tokens: {
        ...this.generateTokens(payload),
      },
    };
  }

  async requestPasswordResetCode(dto: RequestPasswordResetDto): Promise<PasswordResetResponse> {
    const user = await this._userService.findByEmail(dto.email);

    if (user?.id && !user.isDeleted && user.isActive) {
      if (user.resetCodeLockedUntil && new Date() < user.resetCodeLockedUntil) {
        return { message: 'If that email exists, we sent a code.' };
      }

      const code = this.generateNumericCodeSecure(6);
      const codeHash = await bcrypt.hash(code, AUTH_CONSTANTS.SALT_ROUNDS);
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + AUTH_CONSTANTS.RESET_CODE_EXPIRY_MINUTES);

      await this._userService.updateResetToken(user.id, codeHash, expiry);
      await this._userService.updateResetCodeAttempts(user.id, 0);

      try {
        await this._mailService.sendPasswordResetCode(
          user.email,
          code,
          AUTH_CONSTANTS.RESET_CODE_EXPIRY_MINUTES,
        );
      } catch (error) {
        console.error('Failed to send reset code:', error);
      }
    }

    return { message: 'If that email exists, we sent a code.' };
  }

  async verifyPasswordResetCode(dto: ResetPasswordVerifyCodeDto): Promise<any> {
    const user = await this._userService.findByEmail(dto.email);

    if (!user?.id) {
      throw new BadRequestException('Invalid reset code');
    }

    if (!user.resetToken || !user.resetTokenExpiry) {
      throw new BadRequestException('Invalid reset code');
    }

    if (new Date() > user.resetTokenExpiry) {
      await this._userService.clearResetToken(user.id);
      throw new BadRequestException('Reset code has expired');
    }

    const isCodeValid = await bcrypt.compare(dto.code, user.resetToken);
    if (!isCodeValid) {
      const newAttemptCount = (user.resetCodeAttempts || 0) + 1;
      await this._userService.updateResetCodeAttempts(user.id, newAttemptCount);
      throw new BadRequestException('Invalid reset code');
    }

    await this._userService.updateResetCodeAttempts(user.id, 0);

    return { message: 'Reset code is valid' };
  }

  async verifyPasswordResetCodeAndReset(dto: ResetPasswordDto): Promise<PasswordResetResponse> {
    const user = await this._userService.findByEmail(dto.email);

    if (!user?.id) {
      throw new BadRequestException('Invalid reset code');
    }

    // if (user.resetCodeLockedUntil && new Date() < user.resetCodeLockedUntil) {
    //   throw new ForbiddenException(
    //     'Too many failed attempts. Account locked for 15 minutes.',
    //   );
    // }

    if (!user.resetToken || !user.resetTokenExpiry) {
      throw new BadRequestException('Invalid reset code');
    }

    if (new Date() > user.resetTokenExpiry) {
      await this._userService.clearResetToken(user.id);
      throw new BadRequestException('Invalid reset code');
    }

    const isCodeValid = await bcrypt.compare(dto.code, user.resetToken);
    if (!isCodeValid) {
      const newAttemptCount = (user.resetCodeAttempts || 0) + 1;
      await this._userService.updateResetCodeAttempts(user.id, newAttemptCount);

      // if (newAttemptCount >= 5) {
      //   const lockedUntil = new Date();
      //   lockedUntil.setMinutes(lockedUntil.getMinutes() + 15);
      //   await this._userService.updateResetCodeLockedUntil(user.id, lockedUntil);

      //   throw new ForbiddenException(
      //     'Too many failed attempts. Account locked for 15 minutes.',
      //   );
      // }

      throw new BadRequestException('Invalid reset code');
    }

    await this._userService.updateResetCodeAttempts(user.id, 0);

    const hashedPassword = await bcrypt.hash(dto.newPassword, AUTH_CONSTANTS.SALT_ROUNDS);

    await Promise.all([
      this._userService.updatePassword(user.id, hashedPassword),
      this._userService.clearResetToken(user.id),
      this._userService.updatePasswordChangedAt(user.id),
    ]);

    try {
      await this._mailService.sendPasswordResetSuccessEmail(user.email, user.firstName);
    } catch (error) {
      console.error('Failed to send reset success email:', error);
    }

    return { message: 'Password reset successfully' };
  }

  async requestEmailVerificationCode(
    dto: RequestEmailVerificationDto,
  ): Promise<{ message: string }> {
    const user = await this._userService.findByEmail(dto.email);

    if (user?.id && !user.isDeleted && !user.emailVerified) {
      if (user.verificationCodeLockedUntil && new Date() < user.verificationCodeLockedUntil) {
        console.warn(`[SECURITY] Email verification locked for user: ${user.id}`);
        return { message: 'If that email exists, we sent a code.' };
      }

      const code = this.generateNumericCodeSecure(6);
      const codeHash = await bcrypt.hash(code, AUTH_CONSTANTS.SALT_ROUNDS);
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + AUTH_CONSTANTS.VERIFICATION_CODE_EXPIRY_MINUTES);

      await this._userService.setVerificationToken(user.id, codeHash, expiry);
      await this._userService.updateVerificationCodeAttempts(user.id, 0);

      try {
        await this._mailService.sendVerificationCode(
          user.email,
          code,
          AUTH_CONSTANTS.VERIFICATION_CODE_EXPIRY_MINUTES,
        );
      } catch (error) {
        console.error('Failed to send verification code:', error);
      }
    } else {
      console.warn(`[SECURITY] Email verification requested for: ${dto.email}`);
    }

    return { message: 'If that email exists, we sent a code.' };
  }

  async verifyEmailWithCode(dto: VerifyEmailDto): Promise<{ message: string }> {
    const user = await this._userService.findByEmail(dto.email);

    if (!user?.id) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.verificationCodeLockedUntil && new Date() < user.verificationCodeLockedUntil) {
      throw new ForbiddenException('Too many failed attempts. Account locked for 15 minutes.');
    }

    if (user.emailVerified) {
      return { message: 'Email already verified' };
    }

    if (!user.verificationToken || !user.verificationTokenExpiry) {
      throw new BadRequestException('Invalid verification code');
    }

    if (new Date() > user.verificationTokenExpiry) {
      await this._userService.clearVerificationToken(user.id);
      throw new BadRequestException('Invalid verification code');
    }

    const isCodeValid = await bcrypt.compare(dto.code, user.verificationToken);
    if (!isCodeValid) {
      const newAttemptCount = (user.verificationCodeAttempts || 0) + 1;
      await this._userService.updateVerificationCodeAttempts(user.id, newAttemptCount);

      if (newAttemptCount >= 5) {
        const lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + 15);
        await this._userService.updateVerificationCodeLockedUntil(user.id, lockedUntil);

        throw new ForbiddenException('Too many failed attempts. Account locked for 15 minutes.');
      }

      throw new BadRequestException('Invalid verification code');
    }

    await this._userService.updateVerificationCodeAttempts(user.id, 0);
    await this._userService.verifyEmail(user.id);

    try {
      await this._mailService.sendVerificationSuccessEmail(user.email, user.firstName);
    } catch (error) {
      console.error('Failed to send verification success email:', error);
    }

    return { message: 'Email verified successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this._userService.findById(userId, ['id', 'password']);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this._userService.updatePassword(userId, hashedPassword);

    return 'Password changed successfully';
  }

  getFormattedRoles(userRolePermissions: UserRolePermissions[]) {
    const roles = {};
    userRolePermissions.forEach((userRolePermission) => {
      const roleName = userRolePermission.role.name;

      if (!roles[roleName]) {
        roles[roleName] = { [userRolePermission.permission.resource]: [] };
      }

      roles[roleName][userRolePermission.permission.resource] =
        userRolePermission.permission.actions;
    });

    return roles;
  }

  private buildJwtPayload(
    user: Pick<BaseUserResponse, 'id' | 'email' | 'firstName' | 'lastName'>,
  ): AuthJwtPayload {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  private generateTokens(payload: AuthJwtPayload) {
    const now = new Date();
    const jwtExpiresIn = this._configService.get<string>('JWT_EXPIRES_IN');
    const refreshExpiresIn = this._configService.get<string>('REFRESH_JWT_EXPIRE_IN');

    const tokenExpiresAt = new Date(now.getTime() + this.parseDurationToMs(jwtExpiresIn));
    const refreshTokenExpiresAt = new Date(
      now.getTime() + this.parseDurationToMs(refreshExpiresIn),
    );
    return {
      token: this._jwtService.sign(payload),
      refreshToken: this._jwtService.sign(payload, this._refreshTokenConfig),
      tokenExpiresAt: tokenExpiresAt,
      refreshTokenExpiresAt: refreshTokenExpiresAt,
    };
  }

  private parseDurationToMs(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error(`Invalid duration format: ${duration}`);

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
    }
  }

  async isEmailExist(email: string): Promise<void> {
    const existing = await this._userService.findByEmail(email);

    if (existing) {
      throw new ConflictException([
        {
          property: 'email',
          message: AUTH_MESSAGES.EMAIL_EXISTS,
        },
      ]);
    }
  }

  async isPhoneNumberExist(phoneNumber: string): Promise<void> {
    const existing = await this._userService.findOneBy({ phoneNumber });

    if (existing) {
      throw new ConflictException(AUTH_MESSAGES.PHONE_NUMBER_EXISTS);
    }
  }

  private formatRoles(userRolePermissions: UserRolePermissions[]): FormattedRoles {
    if (!userRolePermissions) return {};

    return userRolePermissions.reduce((roles, { role, permission }) => {
      const roleName = role.name;
      if (!roles[roleName]) {
        roles[roleName] = {};
      }
      roles[roleName][permission.resource] = permission.actions;
      return roles;
    }, {} as FormattedRoles);
  }

  private generateNumericCodeSecure(digits: number): string {
    const min = 10 ** (digits - 1);
    const max = 10 ** digits;
    return randomInt(min, max).toString();
  }
}
