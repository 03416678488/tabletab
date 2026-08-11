import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';
import { StockTakeStatus } from '../entities/stock-take.entity';

const STATUSES: StockTakeStatus[] = ['draft', 'completed', 'cancelled'];

class GetStockTakeFiltersDto {
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsIn(STATUSES)
  @IsOptional()
  status?: StockTakeStatus;
}

export class GetStockTakeQueryDto extends IntersectionType(
  GetStockTakeFiltersDto,
  PaginationQueryDto,
) {}
