import { IsBooleanString, IsOptional, IsString } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

class GetPromotionFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  /** 'true' | 'false' — filter by active flag. */
  @IsBooleanString()
  @IsOptional()
  active?: string;
}

export class GetPromotionQueryDto extends IntersectionType(
  GetPromotionFiltersDto,
  PaginationQueryDto,
) {}
