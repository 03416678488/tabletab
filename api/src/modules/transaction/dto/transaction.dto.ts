import { Type } from 'class-transformer';
import { IntersectionType } from '@nestjs/mapped-types';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

const TYPES = [
  'sale',
  'refund',
  'cash_in',
  'cash_out',
  'reservation_deposit',
  'event_payment',
];
const METHODS = ['cash', 'card', 'mfs', 'other'];

export class CreateTransactionDto {
  @IsIn(TYPES)
  type: string;

  @IsIn(METHODS)
  method: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsUUID()
  @IsOptional()
  orderId?: string;

  /** Owning branch for earnings with no order link (deposits, event payments). */
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

class GetTransactionFiltersDto {
  @IsIn(TYPES)
  @IsOptional()
  type?: string;

  @IsIn(METHODS)
  @IsOptional()
  method?: string;

  @IsUUID()
  @IsOptional()
  registerSessionId?: string;

  /** Scope to one branch — matches the transaction's own branch or its order's. */
  @IsUUID()
  @IsOptional()
  branchId?: string;

  /** ISO date bounds (inclusive). */
  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;
}

export class GetTransactionQueryDto extends IntersectionType(
  GetTransactionFiltersDto,
  PaginationQueryDto,
) {}
