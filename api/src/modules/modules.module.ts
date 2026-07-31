import { Module } from '@nestjs/common';
import { UserModule } from '@modules/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { RoleModule } from '@modules/role/role.module';
import { BranchModule } from '@modules/branch/branch.module';
import { StaffModule } from '@modules/staff/staff.module';
import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { FileManagerModule } from '@modules/file-manager/file-manager.module';
import { ResponseModule } from '@cor/filters/exceptions/response.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    PermissionsModule,
    ResponseModule,
    RoleModule,
    BranchModule,
    StaffModule,
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
