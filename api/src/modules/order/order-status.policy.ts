import { ForbiddenException } from '@nestjs/common';

import { OrderStatus, PaymentStatus } from './entities/order.entity';

/**
 * Who may change an order's status / payment, by role. Enforced at the HTTP
 * boundary (order controller) so internal writes — aggregator webhooks, status
 * sync — are unaffected.
 *
 * Decision:
 *  - Status: Owner / Multi-Branch Manager / Branch Manager / Waiter / Delivery
 *    Rider may set any status. Chef owns the kitchen pipeline up to ready
 *    (`confirmed`, `preparing`, `ready`) — accept a ticket, start cooking, mark
 *    it ready — but not the post-ready handoff (served/delivered/completed) or
 *    cancellation. Customer: none.
 *  - Payment (mark paid/unpaid): same set as status, but NOT the Chef.
 */

/** Roles allowed to set any order status. */
const FULL_STATUS_ROLES = new Set<string>([
  'Owner',
  'Multi Branch Manager',
  'Branch Manager',
  'Waiter',
  'Delivery Rider',
]);

/** Roles allowed to change payment status (mark paid / unpaid). */
const PAYMENT_ROLES = new Set<string>([
  'Owner',
  'Multi Branch Manager',
  'Branch Manager',
  'Waiter',
  'Delivery Rider',
]);

const CHEF = 'Chef';

/** The kitchen-pipeline statuses the Chef may set (accept → cook → ready). */
const CHEF_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  'confirmed',
  'preparing',
  'ready',
]);

export function canSetOrderStatus(roleNames: string[], status: OrderStatus): boolean {
  if (roleNames.some((r) => FULL_STATUS_ROLES.has(r))) return true;
  if (roleNames.includes(CHEF)) return CHEF_STATUSES.has(status);
  return false;
}

export function canChangePaymentStatus(roleNames: string[]): boolean {
  return roleNames.some((r) => PAYMENT_ROLES.has(r));
}

/**
 * Enforce the status / payment scope for the caller's roles. Throws
 * ForbiddenException when the update touches a status/payment the role can't set.
 * Only inspects `status` and `paymentStatus` — other fields are unaffected.
 */
export function assertOrderUpdateAllowed(
  roleNames: string[],
  dto: { status?: OrderStatus; paymentStatus?: PaymentStatus },
): void {
  if (dto.status !== undefined && !canSetOrderStatus(roleNames, dto.status)) {
    throw new ForbiddenException(`Your role isn't allowed to set an order to "${dto.status}".`);
  }
  if (dto.paymentStatus !== undefined && !canChangePaymentStatus(roleNames)) {
    throw new ForbiddenException("Your role isn't allowed to change an order's payment status.");
  }
}
