import { IsOptional, IsPositive, IsString } from 'class-validator';
import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_PER_PAGE,
  PAGINATION_DEFAULT_SORT,
} from '@cor/constants/pagination.constant';

export class PaginationQueryDto {
  @IsOptional()
  @IsPositive()
  perPage?: number = PAGINATION_DEFAULT_PER_PAGE;

  @IsOptional()
  @IsPositive()
  page?: number = PAGINATION_DEFAULT_PAGE;

  @IsOptional()
  @IsString()
  sort?: string = PAGINATION_DEFAULT_SORT;
}
