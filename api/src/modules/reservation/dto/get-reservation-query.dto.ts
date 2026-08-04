import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

const STATUSES = ['requested', 'confirmed', 'seated', 'completed', 'no-show', 'cancelled'];

class GetReservationFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  /** YYYY-MM-DD exact-day filter. */
  @IsString()
  @IsOptional()
  date?: string;

  @IsIn(STATUSES)
  @IsOptional()
  status?: string;
}

export class GetReservationQueryDto extends IntersectionType(
  GetReservationFiltersDto,
  PaginationQueryDto,
) {}
