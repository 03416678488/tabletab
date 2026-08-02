import { Controller, Get, Query } from '@nestjs/common';

import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly _service: ReportService) {}

  /** Sales report for a date range: /reports/sales?from=&to= (ISO). */
  @Get('sales')
  sales(@Query('from') from?: string, @Query('to') to?: string) {
    return this._service.getSalesReport(from, to);
  }
}
