import { CreatePermissionDto } from './create-permission.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
