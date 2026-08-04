import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { IsIn, IsUUID } from 'class-validator';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

import { Public } from '@modules/auth/guards/public/public.decorator';
import { PlatformAdmin } from '@modules/auth/guards/platform-admin/platform-admin.decorator';
import { PLAN_IDS, PlanId } from '@modules/plan/plans';
import { BillingService } from './billing.service';

class CheckoutDto {
  @IsUUID()
  tenantId: string;

  @IsIn(PLAN_IDS)
  plan: PlanId;
}

@Controller('billing')
export class BillingController {
  constructor(private readonly _service: BillingService) {}

  /** Platform admin starts a subscription checkout for a tenant. */
  @PlatformAdmin()
  @Post('checkout')
  createCheckout(@Body() dto: CheckoutDto) {
    return this._service.createCheckout(dto.tenantId, dto.plan);
  }

  /** Stripe webhook — verified by signature; needs the raw request body. */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    const raw = req.rawBody?.toString('utf8') ?? '';
    return this._service.handleWebhook(raw, signature);
  }
}
