import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  /** Optional — derived from the title when omitted. */
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers and hyphens',
  })
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsIn(['percentage', 'fixed'])
  discountType: 'percentage' | 'fixed';

  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsString()
  @IsOptional()
  code?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscountAmount?: number;

  /** ISO timestamps. */
  @IsString()
  @IsOptional()
  startsAt?: string;

  @IsString()
  @IsOptional()
  endsAt?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  perCustomerLimit?: number;

  /** Menu items this promotion discounts. Empty/omitted = cart-wide promo. */
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  productIds?: string[];
}
