import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';
import { PurchaseOrderStatus } from '../entities/purchase-order.entity';

const STATUSES: PurchaseOrderStatus[] = [
  'draft',
  'ordered',
  'received',
  'cancelled',
];

class GetPurchaseOrderFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @IsIn(STATUSES)
  @IsOptional()
  status?: PurchaseOrderStatus;
}

export class GetPurchaseOrderQueryDto extends IntersectionType(
  GetPurchaseOrderFiltersDto,
  PaginationQueryDto,
) {}
