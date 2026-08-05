import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

/** Public: check a promo code against a cart subtotal (and optional customer). */
export class ValidatePromotionDto {
  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsUUID()
  @IsOptional()
  customerId?: string;
}
