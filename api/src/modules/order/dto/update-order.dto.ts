import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

import { OrderStatus } from '../entities/order.entity';
import { CreateOrderItemDto } from './create-order.dto';

/** Updates order status/metadata, and optionally replaces its line items + totals. */
export class UpdateOrderDto {
  @IsIn(['placed', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'])
  @IsOptional()
  status?: OrderStatus;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  customerAddress?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  tableId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  /** When present, fully replaces the order's line items. */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsOptional()
  items?: CreateOrderItemDto[];
}
