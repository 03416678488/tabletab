import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @Length(10, 200, {
    message: 'Description must be between 10 and 200 characters',
  })
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

  /** Home branch. Required for single-branch staff (enforced in the service by
   *  role); omitted for Owner / Multi Branch Manager / Customer. */
  @IsUUID()
  @IsOptional()
  branchId?: string;
}
