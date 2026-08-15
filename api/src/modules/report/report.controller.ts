import { Controller, Get, Query } from '@nestjs/common';

import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly _service: ReportService) {}

  /** Sales report for a date range + optional branch: /reports/sales?from=&to=&branchId=. */
  @Get('sales')
  sales(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this._service.getSalesReport(from, to, branchId);
  }
}
