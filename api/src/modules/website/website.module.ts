import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WebsitePage } from './entities/website-page.entity';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';
import { WebsiteController } from './website.controller';
import { WebsiteService } from './website.service';

@Module({
  imports: [TypeOrmModule.forFeature([WebsitePage])],
  controllers: [WebsiteController],
  providers: [WebsiteService, tenantRepositoryProvider(WebsitePage)],
})
export class WebsiteModule {}
