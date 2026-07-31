import { IsEmail, IsString } from 'class-validator';

export class ResetPasswordVerifyCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;
}
