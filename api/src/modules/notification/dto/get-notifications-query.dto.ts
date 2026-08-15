import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
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

  /** Scope to one branch (topbar switcher) — also matches branch-less events. */
  @IsUUID()
  @IsOptional()
  branchId?: string;
}

export class GetNotificationsQueryDto extends IntersectionType(
  GetNotificationsFiltersDto,
  PaginationQueryDto,
) {}
