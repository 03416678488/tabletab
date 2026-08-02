import { IsOptional, IsString } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

class GetCustomerFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;
}

export class GetCustomerQueryDto extends IntersectionType(
  GetCustomerFiltersDto,
  PaginationQueryDto,
) {}
