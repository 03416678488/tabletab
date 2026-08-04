import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PlanFeature, planHasFeature } from './plans';
import { TenantRequest } from './tenancy.types';

export const PLAN_FEATURE_KEY = 'plan_feature';

/**
 * Gate a route/controller behind a plan feature. The resolved tenant's plan must
 * include the feature, or the request is rejected (403). When no tenant is
 * resolved (single-tenant / default connection) the gate is a no-op.
 */
@Injectable()
export class PlanFeatureGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PlanFeature>(PLAN_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const tenant = context.switchToHttp().getRequest<TenantRequest>().tenant;
    if (!tenant) return true; // no tenant context → don't gate

    if (!planHasFeature(tenant.plan, required)) {
      throw new ForbiddenException(
        `Your plan doesn't include this feature (${required}). Upgrade to unlock it.`,
      );
    }
    return true;
  }
}

/** Require the resolved tenant's plan to include `feature`. */
export const RequiresFeature = (feature: PlanFeature) =>
  applyDecorators(SetMetadata(PLAN_FEATURE_KEY, feature), UseGuards(PlanFeatureGuard));
