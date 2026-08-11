import { IsBooleanString, IsOptional, IsString, IsUUID } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

class GetStockItemFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsBooleanString()
  @IsOptional()
  isActive?: string;

  /** When set, list rows include the on-hand quantity for this branch. */
  @IsUUID()
  @IsOptional()
  branchId?: string;

  /** "true" → only items at/below their reorder level (needs `branchId`). */
  @IsBooleanString()
  @IsOptional()
  lowStock?: string;
}

export class GetStockItemQueryDto extends IntersectionType(
  GetStockItemFiltersDto,
  PaginationQueryDto,
) {}
