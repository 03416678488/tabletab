import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @Length(1, 100, { message: 'First name must be 1–100 characters' })
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  password: string;

  @IsString()
  phoneNumber: string;

  /** Role to assign (e.g. "Waiter"). Defaults to Customer when omitted. */
  @IsString()
  @IsOptional()
  roleName?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  /** Home branch. Required for single-branch staff (enforced in the service by
   *  role); omitted for Owner / Multi Branch Manager / Customer. */
  @IsUUID()
  @IsOptional()
  branchId?: string;
}
