import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { TenantRecord, TenantRequest } from './tenancy.types';

/** Inject the resolved tenant (or null) into a handler param. */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantRecord | null => {
    const req = ctx.switchToHttp().getRequest<TenantRequest>();
    return req.tenant ?? null;
  },
);
