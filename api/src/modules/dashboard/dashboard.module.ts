import { Module } from '@nestjs/common';

import { DashboardController } from './dashboard.controller';
import { DashboardAnalyticsService } from './dashboard-analytics.service';

/**
 * Read-only owner analytics over the tenant's real order data. Uses the tenant
 * DataSource directly (via the request), so no entity repositories are needed.
 */
@Module({
  controllers: [DashboardController],
  providers: [DashboardAnalyticsService],
})
export class DashboardModule {}
