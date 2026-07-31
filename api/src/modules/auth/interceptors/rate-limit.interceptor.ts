import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { RateLimitService } from '../services/rate-limit.service';

export interface RateLimitOptions {
  type: 'email-cooldown' | 'email-daily' | 'ip' | 'login';
  limit?: number;
  windowSeconds?: number;
  errorMessage?: string;
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(private rateLimitService: RateLimitService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const body = request.body as any;

    // Get RateLimitOptions from metadata if available
    const options = Reflect.getMetadata('rate-limit-options', context.getHandler());

    if (!options) {
      // No rate limit configuration, allow request
      return next.handle();
    }

    // Get the identifier based on type
    let identifier: string;
    let allowed = true;

    switch (options.type) {
      case 'email-cooldown':
        identifier = body?.email || 'unknown';
        allowed = await this.rateLimitService.checkEmailCodeRequestCooldown(identifier);
        break;

      case 'email-daily':
        identifier = body?.email || 'unknown';
        allowed = await this.rateLimitService.checkEmailDailyCodeRequestLimit(
          identifier,
          options.limit || 5,
        );
        break;

      case 'ip':
        identifier = this.getClientIp(request);
        allowed = await this.rateLimitService.checkIPCodeRequestLimit(
          identifier,
          options.limit || 10,
        );
        break;

      case 'login':
        identifier = body?.email || 'unknown';
        allowed = await this.rateLimitService.checkLoginAttempts(identifier, options.limit || 5);
        break;
    }

    if (!allowed) {
      throw new HttpException(
        options.errorMessage || 'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle();
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      (request.socket?.remoteAddress as string) ||
      'unknown'
    );
  }
}
