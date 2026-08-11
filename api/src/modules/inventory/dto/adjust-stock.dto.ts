import { IsIn, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { StockMovementType } from '../entities/stock-movement.entity';

/** Manual stock change (purchase in, waste out, count correction, transfer). */
const ADJUST_TYPES: StockMovementType[] = [
  'purchase',
  'waste',
  'adjustment',
  'transfer_in',
  'transfer_out',
];

export class AdjustStockDto {
  @IsUUID()
  stockItemId: string;

  @IsUUID()
  branchId: string;

  @IsIn(ADJUST_TYPES)
  type: StockMovementType;

  /**
   * Signed change to on-hand quantity. Positive adds (purchase/transfer_in),
   * negative removes (waste/transfer_out); `adjustment` may be either.
   */
  @IsNumber()
  delta: number;

  @IsString()
  @IsOptional()
  note?: string;
}
