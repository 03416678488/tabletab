import { Transform } from 'class-transformer';
import { IsOptional, IsPositive } from 'class-validator';
import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_PER_PAGE,
  PAGINATION_MAX_PER_PAGE,
} from '@cor/constants/pagination.constant';

export class PaginationQueryDto {
  // Clamped (not rejected) so oversized requests degrade gracefully — callers
  // that paginate by the returned meta.totalPages keep working.
  @IsOptional()
  @IsPositive()
  @Transform(({ value }) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(n, PAGINATION_MAX_PER_PAGE) : value;
  })
  perPage?: number = PAGINATION_DEFAULT_PER_PAGE;

  @IsOptional()
  @IsPositive()
  page?: number = PAGINATION_DEFAULT_PAGE;
}
