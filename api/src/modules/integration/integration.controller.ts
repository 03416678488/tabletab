import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';

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

  /** Recent sync events for a provider (orders in / menu + status out). */
  @Get(':provider/logs')
  logs(@Param('provider') provider: string) {
    return this._service.getLogs(provider);
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

  /** Begin the OAuth flow — returns the provider authorize URL to redirect to. */
  @Get(':provider/oauth/start')
  oauthStart(@Param('provider') provider: string) {
    return this._service.startOAuth(provider);
  }

  /**
   * OAuth callback (provider redirects here). Public + tenant-routed by the
   * `state` slug in the middleware; exchanges the code, then bounces back to the
   * marketplace.
   */
  @Public()
  @Get(':provider/oauth/callback')
  async oauthCallback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const base = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    try {
      await this._service.completeOAuth(provider, code, state);
      res.redirect(`${base}/owner/marketplace?connected=${provider}`);
    } catch (err) {
      const msg = encodeURIComponent((err as Error).message || 'OAuth failed');
      res.redirect(`${base}/owner/marketplace?error=${msg}`);
    }
  }

  @Post(':provider/disconnect')
  disconnect(@Param('provider') provider: string) {
    return this._service.disconnect(provider);
  }
}
