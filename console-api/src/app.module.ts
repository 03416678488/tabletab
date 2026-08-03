import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppModules } from '@modules/modules.module';
import { ConfigModules } from '@config/config.module';
import { GlobalAppModules } from '@modules/common/common.module';
import { GlobalServicesModule } from 'src/services/services.module';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth/jwt-auth.guard';

@Module({
  imports: [ConfigModules, AuthModule, AppModules, GlobalAppModules, GlobalServicesModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
