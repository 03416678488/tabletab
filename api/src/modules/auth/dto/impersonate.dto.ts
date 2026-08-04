import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ImpersonateDto {
  /** Tenant to impersonate into. */
  @IsString()
  tenantSlug: string;

  /** Which user to view as; defaults to the tenant's admin. */
  @IsOptional()
  @IsEmail()
  email?: string;

  /** Platform admin performing the action — recorded in the audit log. */
  @IsOptional()
  @IsString()
  actor?: string;
}
