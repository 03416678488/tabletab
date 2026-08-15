import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { CreateOrderItemDto } from '@modules/order/dto/create-order.dto';

/**
 * A guest dine-in order placed by scanning a table QR. The table and branch are
 * derived server-side from the `:slug` — the client can NOT set them — and every
 * item is re-priced against the live menu. So the only thing the guest controls
 * is what they order (and their name / a note / a promo code).
 */
export class CreateTableOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  promotionCode?: string;

  /** Client-generated per-submit key — a duplicate submit (double-tap, retry)
   *  returns the original order instead of creating a second one. */
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  /**
   * Per-sitting session token from a prior order at this table. Omitted on the
   * first order of a sitting; required to keep adding to the same bill. A stale
   * token (from a previous, settled sitting) is rejected.
   */
  @IsString()
  @IsOptional()
  sessionToken?: string;
}
