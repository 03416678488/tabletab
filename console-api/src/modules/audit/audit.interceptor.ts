import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { AuditService } from './audit.service';
import { AUDIT_KEY, AuditMeta } from './audit.decorator';

/**
 * Writes an audit entry after any @Audit-marked handler completes successfully.
 * Resolves the target id from the response (entity/result) or the route params,
 * and never blocks or fails the request (record() is best-effort).
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditMeta | undefined>(
      AUDIT_KEY,
      context.getHandler(),
    );
    if (!meta) return next.handle();

    const req = context.switchToHttp().getRequest();
    const user = req.user ?? {};
    const params = req.params ?? {};

    return next.handle().pipe(
      tap((body) => {
        // Unwrap the global { _metaData, data } response envelope if present.
        const raw = (body ?? {}) as Record<string, any>;
        const res = (raw && raw._metaData && 'data' in raw ? raw.data : raw) as Record<
          string,
          any
        >;
        const targetId =
          res.id ??
          res.tenant?.id ??
          params.id ??
          params.tenantId ??
          null;
        const label =
          res.slug ?? res.hostname ?? res.tenant?.slug ?? res.name ?? targetId;

        void this.audit.record({
          actorId: user.id ?? null,
          actorEmail: user.email ?? null,
          action: meta.action,
          targetType: meta.targetType ?? null,
          targetId,
          summary: label ? `${meta.action} — ${label}` : meta.action,
          metadata: {
            params,
            ...(res.status ? { status: res.status } : {}),
          },
          ip: req.ip ?? req.headers?.['x-forwarded-for'] ?? null,
        });
      }),
    );
  }
}
