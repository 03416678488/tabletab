import { IsIn, IsOptional, IsString } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

class GetNotificationsFiltersDto {
  /** Filter to one category, e.g. "orders". */
  @IsString()
  @IsOptional()
  category?: string;

  /** "unread" to return only unread notifications. */
  @IsIn(['unread', 'all'])
  @IsOptional()
  status?: string;
}

export class GetNotificationsQueryDto extends IntersectionType(
  GetNotificationsFiltersDto,
  PaginationQueryDto,
) {}
