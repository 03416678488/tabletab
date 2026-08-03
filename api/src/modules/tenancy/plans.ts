/**
 * Plan catalog — the source of truth for what each subscription tier allows.
 * Stored on a tenant as `plan` (a plan id); limits/features are derived here so
 * the runtime can gate features and enforce quotas from the resolved tenant.
 *
 * Keep this in sync with the console's copy (console-api/src/modules/plan/plans.ts).
 */

export type PlanId = 'trial' | 'starter' | 'pro' | 'enterprise';

/** A feature flag a plan may unlock. */
export type PlanFeature =
  | 'pos'
  | 'kds'
  | 'online_orders'
  | 'website_builder'
  | 'multi_branch'
  | 'analytics'
  | 'custom_domain'
  | 'api_access';

export interface PlanLimits {
  /** Max branches; null = unlimited. */
  branches: number | null;
  /** Max staff accounts; null = unlimited. */
  staff: number | null;
  /** Orders per month; null = unlimited. */
  ordersPerMonth: number | null;
}

export interface Plan {
  id: PlanId;
  label: string;
  /** Monthly price in the smallest currency unit (cents). */
  priceCents: number;
  limits: PlanLimits;
  features: PlanFeature[];
}

export const PLANS: Record<PlanId, Plan> = {
  trial: {
    id: 'trial',
    label: 'Trial',
    priceCents: 0,
    limits: { branches: 1, staff: 3, ordersPerMonth: 500 },
    features: ['pos', 'kds', 'online_orders', 'website_builder'],
  },
  starter: {
    id: 'starter',
    label: 'Starter',
    priceCents: 2900,
    limits: { branches: 1, staff: 10, ordersPerMonth: 3000 },
    features: ['pos', 'kds', 'online_orders', 'website_builder'],
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    priceCents: 9900,
    limits: { branches: 5, staff: 50, ordersPerMonth: 30000 },
    features: [
      'pos',
      'kds',
      'online_orders',
      'website_builder',
      'multi_branch',
      'analytics',
      'custom_domain',
    ],
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    priceCents: 0, // custom / sales-led
    limits: { branches: null, staff: null, ordersPerMonth: null },
    features: [
      'pos',
      'kds',
      'online_orders',
      'website_builder',
      'multi_branch',
      'analytics',
      'custom_domain',
      'api_access',
    ],
  },
};

export const DEFAULT_PLAN: PlanId = 'trial';

/** Resolve a stored plan value to a Plan, falling back to the default. */
export function resolvePlan(plan?: string | null): Plan {
  return PLANS[(plan as PlanId) ?? ''] ?? PLANS[DEFAULT_PLAN];
}

/** Whether a plan includes a feature. */
export function planHasFeature(plan: string | null | undefined, feature: PlanFeature): boolean {
  return resolvePlan(plan).features.includes(feature);
}
