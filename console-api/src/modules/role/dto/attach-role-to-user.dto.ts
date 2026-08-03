import { IsNotEmpty, IsNumber } from 'class-validator';
import { ValidationConstants } from '@cor/constants/validation.constants';

export class AttachRoleToUserDto {
  @IsNumber({}, { message: ValidationConstants.SHOULD_BE_NUMBER })
  userId: string;

  @IsNumber({}, { message: ValidationConstants.SHOULD_BE_NUMBER })
  @IsNotEmpty()
  roleId: number;

  @IsNumber({}, { message: ValidationConstants.SHOULD_BE_NUMBER })
  @IsNotEmpty()
  permissionId: number;
}
