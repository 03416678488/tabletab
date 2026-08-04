import {
  Controller,
  ForbiddenException,
  Get,
  Query,
} from '@nestjs/common';

import { Public } from '@modules/auth/guards/public/public.decorator';
import { EdgeService } from './edge.service';

/**
 * Endpoints the TLS edge proxy calls. Public (the proxy is unauthenticated), but
 * side-effect-free and read-only.
 */
@Controller('edge')
export class EdgeController {
  constructor(private readonly _service: EdgeService) {}

  /**
   * On-demand-TLS authorization hook (Caddy `on_demand_tls.ask`, Traefik, etc.).
   * The proxy issues a certificate only when this returns 2xx. We return 200 for
   * hostnames we actually serve and 403 for everything else, so cert issuance
   * can never be triggered for arbitrary domains.
   */
  @Public()
  @Get('authorize-tls')
  async authorizeTls(@Query('domain') domain?: string): Promise<{ ok: true }> {
    if (!domain || !(await this._service.isRoutable(domain))) {
      throw new ForbiddenException('Host not served by this platform');
    }
    return { ok: true };
  }
}
