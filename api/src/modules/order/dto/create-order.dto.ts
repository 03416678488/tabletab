import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

import { OrderType } from '../entities/order.entity';

export class CreateOrderItemDto {
  @IsUUID()
  @IsOptional()
  menuItemId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateOrderDto {
  @IsIn(['pos', 'online', 'table'])
  orderType: OrderType;

  /** Origin channel, e.g. "foodpanda". */
  @IsString()
  @IsOptional()
  source?: string;

  /** The provider's own order id. */
  @IsString()
  @IsOptional()
  externalRef?: string;

  @IsUUID()
  @IsOptional()
  tableId?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  customerAddress?: string;

  @IsNumber()
  @IsOptional()
  customerLat?: number;

  @IsNumber()
  @IsOptional()
  customerLng?: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsIn(['unpaid', 'paid'])
  @IsOptional()
  paymentStatus?: 'unpaid' | 'paid';

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  deliveryFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  /** A promo code to validate + apply server-side (authoritative discount). */
  @IsString()
  @IsOptional()
  promotionCode?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
