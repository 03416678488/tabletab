import { Controller, DefaultValuePipe, Get, Query } from '@nestjs/common';

import { RequiresFeature } from '@modules/tenancy/plan-feature.guard';
import {
  DashboardAnalyticsService,
  Period,
} from './dashboard-analytics.service';

const PERIODS: Period[] = ['day', 'month', 'year'];

/**
 * Owner dashboard analytics, aggregated from the tenant's real orders. Staff-only
 * (the global JWT guard authenticates; tenant middleware routes to the right DB)
 * and gated behind the `analytics` plan feature.
 */
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly _analytics: DashboardAnalyticsService) {}

  @RequiresFeature('analytics')
  @Get('analytics')
  getAnalytics(
    @Query('period', new DefaultValuePipe('day')) period: string,
    @Query('branchId') branchId?: string,
    // Optional custom range (YYYY-MM-DD); when both are set they override the
    // preset and the series auto-buckets by span. Invalid values are ignored.
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const p = (PERIODS.includes(period as Period) ? period : 'day') as Period;
    const valid = (d?: string) =>
      d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : undefined;
    return this._analytics.getOwnerAnalytics(
      p,
      branchId,
      valid(from),
      valid(to),
    );
  }
}
