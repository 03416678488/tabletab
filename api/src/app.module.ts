import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppModules } from '@modules/modules.module';
import { ConfigModules } from '@config/config.module';
import { GlobalAppModules } from '@modules/common/common.module';
import { GlobalServicesModule } from 'src/services/services.module';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth/jwt-auth.guard';
import { TenantBindingGuard } from '@modules/tenancy/tenant-binding.guard';

@Module({
  imports: [ConfigModules, AuthModule, AppModules, GlobalAppModules, GlobalServicesModule],
  providers: [
    // Order matters: authenticate first, then bind the request to the token's tenant.
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantBindingGuard,
    },
  ],
})
export class AppModule {}
