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
import { PLAN_IDS } from '@modules/plan/plans';

const SLUG_RULE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Self-serve signup: a prospective restaurant owner provisions their own tenant
 * and becomes its first admin. Public (no auth) — keep validation strict.
 */
export class SignupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  restaurantName: string;

  /** URL-safe handle → subdomain + database name. Must be globally unique. */
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  @Matches(SLUG_RULE, {
    message: 'Handle must be lowercase letters, numbers, and hyphens',
  })
  handle: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

  @IsOptional()
  @IsIn(PLAN_IDS)
  plan?: string;
}
