import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

import { ValidationConstants } from '@cor/constants/validation.constants';

export class UserRegisterDto {
  @IsEmail({}, { message: ValidationConstants.INVALID_EMAIL_ADDRESS })
  public readonly email: string;

  @IsString()
  @Length(6, 20, { message: ValidationConstants.PASSWORD_MUST_BE_IN_BETWEEN })
  public readonly password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  phoneNumber: string;
}
