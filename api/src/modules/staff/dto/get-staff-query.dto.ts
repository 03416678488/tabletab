import { IsBooleanString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';
import { StaffRoleEnum } from '../enums/staff-role.enum';

class GetStaffFiltersDto {
  /** Free-text search over first/last name or email. */
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(StaffRoleEnum)
  @IsOptional()
  role?: StaffRoleEnum;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsBooleanString()
  @IsOptional()
  isActive?: string;
}

export class GetStaffQueryDto extends IntersectionType(
  GetStaffFiltersDto,
  PaginationQueryDto,
) {}
