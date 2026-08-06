import { IsBooleanString, IsOptional, IsString } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

class GetBranchFiltersDto {
  /** Multi-column search (name, address, city, phone). */
  @IsString()
  @IsOptional()
  search?: string;

  /** Legacy single-column name search (kept for compatibility). */
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsBooleanString()
  @IsOptional()
  isOpen?: string;
}

export class GetBranchQueryDto extends IntersectionType(
  GetBranchFiltersDto,
  PaginationQueryDto,
) {}
