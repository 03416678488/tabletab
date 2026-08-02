import { IsBooleanString, IsOptional, IsString, IsUUID } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

class GetTableFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsUUID()
  @IsOptional()
  areaId?: string;

  @IsBooleanString()
  @IsOptional()
  isActive?: string;
}

export class GetTableQueryDto extends IntersectionType(
  GetTableFiltersDto,
  PaginationQueryDto,
) {}
