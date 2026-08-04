import {
  IsBooleanString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

class GetMenuItemFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  /** Comma-separated category UUIDs (multi-category filter). */
  @IsString()
  @IsOptional()
  categoryIds?: string;

  @IsBooleanString()
  @IsOptional()
  isAvailable?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}

export class GetMenuItemQueryDto extends IntersectionType(
  GetMenuItemFiltersDto,
  PaginationQueryDto,
) {}
