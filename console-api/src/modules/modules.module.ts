import { Module } from '@nestjs/common';
import { UserModule } from '@modules/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { RoleModule } from '@modules/role/role.module';
import { RolePermissionModule } from '@modules/role-permission/role-permission.module';
import { TenantModule } from '@modules/tenant/tenant.module';
import { SignupModule } from '@modules/signup/signup.module';
import { DomainModule } from '@modules/domain/domain.module';
import { EdgeModule } from '@modules/edge/edge.module';
import { AuditModule } from '@modules/audit/audit.module';
import { PlanModule } from '@modules/plan/plan.module';
import { BillingModule } from '@modules/billing/billing.module';
import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { FileManagerModule } from '@modules/file-manager/file-manager.module';
import { ResponseModule } from '@cor/filters/exceptions/response.module';

/**
 * Control-plane modules only. This service manages the platform (tenants, and the
 * platform admins who operate it) — it does NOT contain restaurant-domain features
 * (menu, orders, POS, etc.); those live in the per-tenant API.
 */
@Module({
  imports: [
    // Platform auth + RBAC
    UserModule,
    AuthModule,
    PermissionsModule,
    RoleModule,
    RolePermissionModule,
    // Control plane
    TenantModule,
    SignupModule,
    DomainModule,
    EdgeModule,
    AuditModule,
    PlanModule,
    BillingModule,
    // Shared infra
    ResponseModule,
    PaginationModule,
    FileManagerModule,
  ],
  exports: [
    UserModule,
    AuthModule,
    PermissionsModule,
    ResponseModule,
    RoleModule,
    PaginationModule,
    FileManagerModule,
  ],
})
export class AppModules {}
