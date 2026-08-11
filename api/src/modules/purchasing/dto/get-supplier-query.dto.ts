import { IsBooleanString, IsOptional, IsString } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

class GetSupplierFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsBooleanString()
  @IsOptional()
  isActive?: string;
}

export class GetSupplierQueryDto extends IntersectionType(
  GetSupplierFiltersDto,
  PaginationQueryDto,
) {}
