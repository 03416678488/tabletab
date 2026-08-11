import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { StockUnit } from '../entities/stock-item.entity';

const UNITS: StockUnit[] = ['kg', 'g', 'l', 'ml', 'pcs'];

export class CreateStockItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(UNITS)
  @IsOptional()
  unit?: StockUnit;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costPerUnit?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
