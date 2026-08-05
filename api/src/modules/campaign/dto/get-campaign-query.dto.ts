import { IsIn, IsOptional, IsString } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

const STATUSES = ['draft', 'scheduled', 'sending', 'sent', 'failed'];

class GetCampaignFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsIn(STATUSES)
  @IsOptional()
  status?: string;
}

export class GetCampaignQueryDto extends IntersectionType(
  GetCampaignFiltersDto,
  PaginationQueryDto,
) {}
