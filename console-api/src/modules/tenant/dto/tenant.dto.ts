import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import type { TenantStatus } from '../entities/tenant.entity';
import { PLAN_IDS } from '@modules/plan/plans';

const SLUG_RULE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateTenantDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsString()
  @Matches(SLUG_RULE, {
    message: 'Slug must be lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsOptional()
  @IsIn(PLAN_IDS)
  plan?: string;

  // ── First admin (optional) ──
  // When both are provided, a first admin user is seeded into the new tenant DB.
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  adminEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Admin password must be at least 8 characters' })
  @MaxLength(128)
  adminPassword?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  adminPhone?: string;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn(PLAN_IDS)
  plan?: string;

  @IsOptional()
  @IsString()
  storefrontDomain?: string;

  @IsOptional()
  @IsString()
  adminDomain?: string;
}

export class UpdateTenantStatusDto {
  @IsIn(['provisioning', 'active', 'suspended'])
  status: TenantStatus;
}
