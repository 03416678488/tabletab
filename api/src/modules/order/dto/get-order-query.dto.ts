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

  @IsIn([
    'placed',
    'confirmed',
    'preparing',
    'ready',
    'out-for-delivery',
    'served',
    'delivered',
    'completed',
    'cancelled',
  ])
  @IsOptional()
  status?: string;

  @IsIn(['unpaid', 'paid'])
  @IsOptional()
  paymentStatus?: string;

  @IsUUID()
  @IsOptional()
  tableId?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;
}

export class GetOrderQueryDto extends IntersectionType(
  GetOrderFiltersDto,
  PaginationQueryDto,
) {}
