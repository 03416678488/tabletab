import type { AppNotification } from "@/features/notifications/types/notification.types";

/** Category → dashboard slug for click-through. Categories without a target
 *  (e.g. reservations — no dashboard route yet) return null and don't navigate. */
const SLUG_BY_CATEGORY: Record<string, string | undefined> = {
  payments: "transactions",
  register: "cash-register",
};

/** orderType → the list route that shows it. */
const ORDER_SLUG: Record<string, string> = {
  pos: "pos-orders",
  online: "online-orders",
  table: "table-orders",
};

/**
 * Role-prefixed href for a notification, or null if it has no destination.
 * Order notifications open the matching list pre-searched to that order number,
 * so the click lands on the *specific* order rather than the whole list.
 */
export function notificationHref(role: string, n: AppNotification): string | null {
  if (n.category === "orders") {
    const type = String(n.data?.orderType ?? "pos");
    const slug = ORDER_SLUG[type] ?? "pos-orders";
    const num = n.data?.orderNumber;
    const q = num ? `?q=${encodeURIComponent(String(num))}` : "";
    return `/${role}/${slug}${q}`;
  }
  const slug = SLUG_BY_CATEGORY[n.category];
  return slug ? `/${role}/${slug}` : null;
}
