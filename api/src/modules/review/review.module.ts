import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Review } from './entities/review.entity';
import { MenuItem } from '@modules/menu/entities/menu-item.entity';
import { Branch } from '@modules/branch/entities/branch.entity';

import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewValidatorService } from './services/review-validator.service';
import { ReviewHelperService } from './services/review.helper.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';
import { tenantRepositoryProvider } from '@modules/tenancy/tenant-repository.provider';
import { NotificationModule } from '@modules/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, MenuItem, Branch]),
    PaginationModule,
    ErrorModule,
    NotificationModule,
  ],
  controllers: [ReviewController],
  providers: [
    ReviewService,
    ReviewValidatorService,
    ReviewHelperService,
    // Tenant-aware: reviews (and the items/branches they reference) resolve to
    // the current request's tenant database.
    tenantRepositoryProvider(Review),
    tenantRepositoryProvider(MenuItem),
    tenantRepositoryProvider(Branch),
  ],
  exports: [ReviewService, TypeOrmModule],
})
export class ReviewModule {}
