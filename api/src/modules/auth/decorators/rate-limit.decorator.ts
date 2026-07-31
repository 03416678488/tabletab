import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { RateLimitInterceptor, RateLimitOptions } from '../interceptors/rate-limit.interceptor';

/**
 * RateLimit decorator for endpoint rate limiting
 *
 * @example
 * // Email cooldown (60 seconds)
 * @RateLimit({ type: 'email-cooldown' })
 * async requestVerification(@Body() dto: RequestEmailDto) { }
 *
 * @example
 * // Daily email limit (5 per day)
 * @RateLimit({ type: 'email-daily', limit: 10 })
 * async requestReset(@Body() dto: RequestPasswordDto) { }
 *
 * @example
 * // IP-based limit (10 per hour)
 * @RateLimit({ type: 'ip', limit: 20 })
 * async someEndpoint() { }
 *
 * @example
 * // Login attempts (5 per hour)
 * @RateLimit({ type: 'login', limit: 3 })
 * async login(@Body() credentials: LoginDto) { }
 */
export function RateLimit(options: RateLimitOptions) {
  return applyDecorators(
    SetMetadata('rate-limit-options', options),
    UseInterceptors(RateLimitInterceptor),
  );
}

export type { RateLimitOptions } from '../interceptors/rate-limit.interceptor';
