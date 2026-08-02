import { IsBooleanString, IsOptional, IsString, IsUUID } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

class GetMenuItemFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsBooleanString()
  @IsOptional()
  isAvailable?: string;
}

export class GetMenuItemQueryDto extends IntersectionType(
  GetMenuItemFiltersDto,
  PaginationQueryDto,
) {}
