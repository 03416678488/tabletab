import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateStockTakeDto {
  @IsUUID()
  branchId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  /**
   * Items to count. When omitted, the take snapshots every active stock item's
   * on-hand at the branch.
   */
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  stockItemIds?: string[];
}
