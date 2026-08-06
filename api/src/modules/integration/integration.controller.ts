import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { Public } from '@modules/auth/guards/public/public.decorator';

import { IntegrationService } from './integration.service';
import { AggregatorService } from './services/integration-aggregator.service';
import { ConnectIntegrationDto } from './dto/connect-integration.dto';

@Controller('integrations')
export class IntegrationController {
  constructor(
    private readonly _service: IntegrationService,
    private readonly _aggregator: AggregatorService,
  ) {}

  /**
   * Delivery-aggregator order webhook (foodpanda / uber eats / deliveroo).
   * Public — the provider can't send our JWT; verified by `x-webhook-secret`.
   * Declared before the other `:provider/*` routes; the tenant is resolved by
   * the Host-based tenant middleware.
   */
  @Public()
  @Post(':provider/webhook/:token')
  webhook(
    @Param('provider') provider: string,
    @Param('token') token: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this._aggregator.handleWebhook(provider, token, body);
  }

  /** Push our menu out to an aggregator's catalog (staff only). */
  @Post(':provider/push-menu')
  pushMenu(@Param('provider') provider: string) {
    return this._aggregator.pushMenu(provider);
  }

  /** Marketplace catalog + this tenant's connection state. */
  @Get()
  list() {
    return this._service.getCatalog();
  }

  @Post(':provider/connect')
  connect(@Param('provider') provider: string, @Body() dto: ConnectIntegrationDto) {
    return this._service.connect(provider, dto.config);
  }

  @Post(':provider/disconnect')
  disconnect(@Param('provider') provider: string) {
    return this._service.disconnect(provider);
  }
}
