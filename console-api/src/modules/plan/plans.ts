/**
 * Plan catalog — source of truth for subscription tiers (limits + features).
 * Keep in sync with the runtime copy (api/src/modules/tenancy/plans.ts).
 */

export type PlanId = 'trial' | 'starter' | 'pro' | 'enterprise';

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
  branches: number | null;
  staff: number | null;
  ordersPerMonth: number | null;
}

export interface Plan {
  id: PlanId;
  label: string;
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
    priceCents: 0,
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

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];
export const DEFAULT_PLAN: PlanId = 'trial';

/** The Stripe Price id for a paid plan (from env, e.g. STRIPE_PRICE_PRO). */
export function stripePriceFor(planId: PlanId): string | undefined {
  return process.env[`STRIPE_PRICE_${planId.toUpperCase()}`];
}

/** Map a Stripe Price id back to a plan (for webhook → plan resolution). */
export function planForStripePrice(priceId: string | undefined): PlanId | undefined {
  if (!priceId) return undefined;
  return PLAN_IDS.find((id) => stripePriceFor(id) === priceId);
}
