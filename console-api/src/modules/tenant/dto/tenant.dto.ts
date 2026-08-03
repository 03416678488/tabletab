import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
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
