import { Controller, Get } from '@nestjs/common';

import { PLANS } from './plans';

/** Exposes the plan catalog to the console UI (behind the default auth guard). */
@Controller('plans')
export class PlanController {
  @Get()
  list() {
    return Object.values(PLANS);
  }
}
