import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

class GetOrderFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsIn(['pos', 'online', 'table'])
  @IsOptional()
  orderType?: string;

  @IsIn(['placed', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'])
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  tableId?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;
}

export class GetOrderQueryDto extends IntersectionType(
  GetOrderFiltersDto,
  PaginationQueryDto,
) {}
