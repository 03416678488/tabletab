import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tenant } from '@modules/tenant/entities/tenant.entity';
import {
  DEFAULT_PLAN,
  PlanId,
  planForStripePrice,
  stripePriceFor,
} from '@modules/plan/plans';
import { stripe, verifyWebhook } from './stripe';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly _repo: Repository<Tenant>,
  ) {}

  /** Create a Stripe Checkout Session to subscribe a tenant to a paid plan. */
  async createCheckout(tenantId: string, plan: PlanId): Promise<{ url: string }> {
    const tenant = await this._repo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const price = stripePriceFor(plan);
    if (!price) {
      throw new BadRequestException(`No Stripe price configured for plan "${plan}"`);
    }

    // Reuse or create the tenant's Stripe customer.
    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.post('/customers', {
        name: tenant.name,
        metadata: { tenantId: tenant.id, slug: tenant.slug },
      });
      customerId = customer.id;
      tenant.stripeCustomerId = customerId;
      await this._repo.save(tenant);
    }

    const appUrl = process.env.CONSOLE_APP_URL || 'http://localhost:3100';
    const session = await stripe.post('/checkout/sessions', {
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      success_url: `${appUrl}/tenants?billing=success`,
      cancel_url: `${appUrl}/tenants?billing=cancelled`,
      subscription_data: { metadata: { tenantId: tenant.id, plan } },
      metadata: { tenantId: tenant.id, plan },
    });

    return { url: session.url };
  }

  /** Verify + apply a Stripe webhook. Keeps tenant.plan/subscription in sync. */
  async handleWebhook(rawBody: string, signature?: string): Promise<{ received: boolean }> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new BadRequestException('Webhooks are not configured');

    const event = verifyWebhook(rawBody, signature, secret);
    this.logger.log(`Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object;
        await this.applySubscription(s.metadata?.tenantId, s.subscription, s.metadata?.plan);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object;
        const plan =
          (sub.metadata?.plan as PlanId | undefined) ??
          planForStripePrice(sub.items?.data?.[0]?.price?.id);
        await this.syncSubscription(sub, plan);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await this.cancelSubscription(sub.id);
        break;
      }
      default:
        break;
    }
    return { received: true };
  }

  private async applySubscription(
    tenantId: string | undefined,
    subscriptionId: string | undefined,
    plan: string | undefined,
  ): Promise<void> {
    if (!tenantId) return;
    const tenant = await this._repo.findOne({ where: { id: tenantId } });
    if (!tenant) return;
    if (subscriptionId) tenant.stripeSubscriptionId = subscriptionId;
    if (plan) tenant.plan = plan;
    tenant.subscriptionStatus = 'active';
    await this._repo.save(tenant);
    this.logger.log(`Subscription applied to ${tenant.slug}: plan=${tenant.plan}`);
  }

  private async syncSubscription(sub: any, plan?: PlanId): Promise<void> {
    const tenant = await this.findByCustomerOrTenant(sub);
    if (!tenant) return;
    tenant.stripeSubscriptionId = sub.id;
    tenant.subscriptionStatus = sub.status;
    if (plan) tenant.plan = plan;
    if (sub.current_period_end) {
      tenant.currentPeriodEnd = new Date(sub.current_period_end * 1000);
    }
    await this._repo.save(tenant);
    this.logger.log(`Subscription synced for ${tenant.slug}: status=${sub.status}, plan=${tenant.plan}`);
  }

  private async cancelSubscription(subscriptionId: string): Promise<void> {
    const tenant = await this._repo.findOne({ where: { stripeSubscriptionId: subscriptionId } });
    if (!tenant) return;
    tenant.subscriptionStatus = 'canceled';
    tenant.plan = DEFAULT_PLAN; // drop back to the free/trial tier
    await this._repo.save(tenant);
    this.logger.warn(`Subscription canceled for ${tenant.slug} → downgraded to ${DEFAULT_PLAN}`);
  }

  private async findByCustomerOrTenant(sub: any): Promise<Tenant | null> {
    if (sub.metadata?.tenantId) {
      return this._repo.findOne({ where: { id: sub.metadata.tenantId } });
    }
    if (sub.customer) {
      return this._repo.findOne({ where: { stripeCustomerId: sub.customer } });
    }
    return null;
  }
}
