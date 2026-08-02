import { IsBooleanString, IsOptional, IsString } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

class GetMenuFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsBooleanString()
  @IsOptional()
  isActive?: string;
}

export class GetMenuQueryDto extends IntersectionType(
  GetMenuFiltersDto,
  PaginationQueryDto,
) {}
