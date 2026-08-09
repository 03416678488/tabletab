/**
 * Central channel-name builders. Emitters and SSE endpoints import these so a
 * typo can never split a producer from its consumers.
 */

/** One customer tracking one order (capability by UUID). */
export const orderChannel = (orderId: string): string => `order:${orderId}`;

/** One staff user's notification stream (bell inbox). Private to that user. */
export const notifChannel = (userId: string): string => `notif:${userId}`;

/**
 * Tenant-scoped kitchen/pickup board. `default` covers the dev / tenant-less DB
 * (both storefront orders and staff resolve to the same key there).
 */
export const boardChannel = (tenantId?: string | null): string =>
  `board:${tenantId ?? 'default'}`;

/** Tenant menu changes (availability / price / add / remove). Public per tenant. */
export const menuChannel = (tenantId?: string | null): string =>
  `menu:${tenantId ?? 'default'}`;

/**
 * Tenant branch changes — open/closed, online ordering, delivery/pickup flags,
 * fees. Public per tenant (branches are public on the storefront).
 */
export const branchesChannel = (tenantId?: string | null): string =>
  `branches:${tenantId ?? 'default'}`;

/**
 * Tenant floor/table changes — table CRUD *and* occupancy shifts driven by orders.
 * Staff-only.
 */
export const tablesChannel = (tenantId?: string | null): string =>
  `tables:${tenantId ?? 'default'}`;

/** One guest tracking one reservation (capability by UUID). */
export const reservationChannel = (reservationId: string): string =>
  `reservation:${reservationId}`;

/** Tenant reservation book — new + changed bookings for the manager view. Staff. */
export const reservationsChannel = (tenantId?: string | null): string =>
  `reservations:${tenantId ?? 'default'}`;

/** Tenant service-request queue — guests calling a waiter / asking for the bill. Staff. */
export const serviceChannel = (tenantId?: string | null): string =>
  `service:${tenantId ?? 'default'}`;

/** One guest tracking one event booking (capability by UUID). */
export const eventChannel = (eventId: string): string => `event:${eventId}`;

/** Tenant event book — new + changed event bookings for the manager view. Staff. */
export const eventsChannel = (tenantId?: string | null): string =>
  `events:${tenantId ?? 'default'}`;
