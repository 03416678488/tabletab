import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

const STATUSES = ['pending', 'approved', 'rejected'];

class GetReviewFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  menuItemId?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsIn(STATUSES)
  @IsOptional()
  status?: string;
}

export class GetReviewQueryDto extends IntersectionType(
  GetReviewFiltersDto,
  PaginationQueryDto,
) {}
