import { IsBoolean, IsOptional, IsString } from 'class-validator';

/** Per-tenant WhatsApp Cloud API credentials (stored in settings, admin-only). */
export class WhatsappConfigDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsOptional()
  phoneNumberId?: string;

  @IsString()
  @IsOptional()
  accessToken?: string;

  @IsString()
  @IsOptional()
  businessAccountId?: string;

  /** Storefront base URL used to build promotion links, e.g. https://shop.example.com */
  @IsString()
  @IsOptional()
  storefrontUrl?: string;
}
