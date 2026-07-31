import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RequestEmailVerificationDto {
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;
}
