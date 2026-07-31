import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PermissionsEnum } from '../enums/permissions.enum';

export class CreatePermissionDto {
  @IsNotEmpty()
  @IsString()
  resource: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(PermissionsEnum, { each: true })
  actions: PermissionsEnum[];
}
