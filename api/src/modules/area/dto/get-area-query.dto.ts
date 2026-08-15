import { IsOptional, IsString, IsUUID } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

class GetAreaFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  /** Scope to one branch (topbar switcher). */
  @IsUUID()
  @IsOptional()
  branchId?: string;
}

export class GetAreaQueryDto extends IntersectionType(
  GetAreaFiltersDto,
  PaginationQueryDto,
) {}
