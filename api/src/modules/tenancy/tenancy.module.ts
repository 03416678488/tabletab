import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { TenantRegistryService } from './tenant-registry.service';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantContextMiddleware } from './tenant-context.middleware';
import { TenancyController } from './tenancy.controller';

/**
 * Global so any module can inject the registry / connection services to become
 * tenant-aware. The middleware runs on every route and resolves the tenant.
 */
@Global()
@Module({
  controllers: [TenancyController],
  providers: [TenantRegistryService, TenantConnectionService],
  exports: [TenantRegistryService, TenantConnectionService],
})
export class TenancyModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
