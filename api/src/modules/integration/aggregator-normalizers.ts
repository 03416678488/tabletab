/**
 * Per-provider webhook payload normalization. Each aggregator posts its own JSON
 * shape; a normalizer maps it to one canonical `NormalizedOrder`. The mappings
 * below are representative — adjust each to the provider's real partner spec.
 * Every normalizer falls back to the generic shape when its native fields are
 * absent, so a normalized/test payload always works too.
 */

export interface NormalizedOrderItem {
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface NormalizedOrder {
  externalId?: string;
  customer: { name?: string; phone?: string; address?: string };
  items: NormalizedOrderItem[];
  deliveryFee?: number;
  note?: string;
}

type Raw = Record<string, any>;
type Normalizer = (raw: Raw) => NormalizedOrder;

// ── small safe accessors ─────────────────────────────────────────────────────
const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim() : undefined;
const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
};
const arr = (v: unknown): Raw[] => (Array.isArray(v) ? v : []);
/** Minor units (cents / fractional) → major. */
const minor = (v: unknown): number | undefined => {
  const n = num(v);
  return n === undefined ? undefined : n / 100;
};
const fullName = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(' ') || undefined;

// ── generic (our canonical shape — also the fallback) ────────────────────────
const generic: Normalizer = (raw) => ({
  externalId: str(raw.orderId) ?? str(raw.order_id) ?? str(raw.id),
  customer: {
    name: str(raw.customer?.name),
    phone: str(raw.customer?.phone),
    address: str(raw.customer?.address),
  },
  items: arr(raw.items).map((it) => ({
    name: str(it?.name) ?? 'Item',
    price: num(it?.price) ?? 0,
    quantity: num(it?.quantity) ?? 1,
    notes: str(it?.notes),
  })),
  deliveryFee: num(raw.deliveryFee),
  note: str(raw.note),
});

// ── foodpanda (products[], decimal prices) ───────────────────────────────────
const foodpanda: Normalizer = (raw) => {
  const products = arr(raw.products);
  if (!products.length) return generic(raw);
  const c = raw.customer ?? {};
  return {
    externalId: str(raw.code) ?? str(raw.token) ?? str(raw.order_id),
    customer: {
      name: fullName(str(c.firstName), str(c.lastName)) ?? str(c.name),
      phone: str(c.mobile) ?? str(c.phone),
      address: str(c.address) ?? str(c.deliveryAddress),
    },
    items: products.map((p) => ({
      name: str(p?.name) ?? 'Item',
      price: num(p?.unitPrice) ?? num(p?.paidPrice) ?? 0,
      quantity: num(p?.quantity) ?? 1,
      notes: str(p?.comment),
    })),
    deliveryFee: num(raw.deliveryFee) ?? num(raw.delivery?.fee),
    note: str(raw.comment),
  };
};

// ── uber eats (cart.items[], amounts in cents) ───────────────────────────────
const ubereats: Normalizer = (raw) => {
  const items = arr(raw.cart?.items);
  if (!items.length) return generic(raw);
  const eater = raw.eater ?? {};
  return {
    externalId: str(raw.id),
    customer: {
      name: fullName(str(eater.first_name), str(eater.last_name)),
      phone: str(eater.phone),
      address: str(raw.delivery?.location?.address),
    },
    items: items.map((it) => ({
      name: str(it?.title) ?? str(it?.name) ?? 'Item',
      price: minor(it?.price?.unit_price?.amount ?? it?.price?.amount) ?? 0,
      quantity: num(it?.quantity) ?? 1,
      notes: str(it?.special_instructions),
    })),
    deliveryFee: minor(raw.delivery?.fee?.amount),
    note: str(raw.special_instructions),
  };
};

// ── deliveroo (order.items[], unit_price.fractional in minor units) ──────────
const deliveroo: Normalizer = (raw) => {
  const order = raw.order ?? raw;
  const items = arr(order.items);
  if (!items.length) return generic(raw);
  const c = order.customer ?? {};
  return {
    externalId: str(order.id) ?? str(order.order_id),
    customer: {
      name: fullName(str(c.first_name), str(c.last_name)) ?? str(c.name),
      phone: str(c.phone_number) ?? str(c.contact_number),
      address: str(order.delivery_address),
    },
    items: items.map((it) => ({
      name: str(it?.name) ?? 'Item',
      price: minor(it?.unit_price?.fractional) ?? num(it?.unit_price) ?? 0,
      quantity: num(it?.quantity) ?? 1,
      notes: str(it?.special_instructions),
    })),
    deliveryFee: minor(order.delivery_fee?.fractional),
    note: str(order.notes),
  };
};

const NORMALIZERS: Record<string, Normalizer> = { foodpanda, ubereats, deliveroo };

/** Normalize a raw webhook body for a provider (falls back to the generic shape). */
export function normalizeOrder(provider: string, raw: Raw): NormalizedOrder {
  return (NORMALIZERS[provider] ?? generic)(raw ?? {});
}
