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

const TYPES = ['sale', 'refund', 'cash_in', 'cash_out'];
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

  /** ISO date bounds (inclusive). */
  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  to?: string;
}

export class GetTransactionQueryDto extends IntersectionType(
  GetTransactionFiltersDto,
  PaginationQueryDto,
) {}
