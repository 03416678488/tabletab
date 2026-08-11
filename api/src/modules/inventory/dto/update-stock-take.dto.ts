import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class StockTakeCountInput {
  @IsUUID()
  stockItemId: string;

  @IsNumber()
  @Min(0)
  countedQty: number;
}

/** Update counted quantities on a draft take (and/or its notes). */
export class UpdateStockTakeDto {
  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockTakeCountInput)
  @IsOptional()
  lines?: StockTakeCountInput[];
}
