import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Minimal, dependency-free Stripe client: talks to the Stripe REST API over
 * fetch and verifies webhook signatures with Node crypto. Avoids pulling the
 * full SDK; swap for the official `stripe` package if you prefer.
 */

const STRIPE_API = 'https://api.stripe.com/v1';

/** Flatten a nested object into Stripe's bracketed form-encoding. */
function encodeForm(obj: Record<string, unknown>, prefix = ''): string[] {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    const field = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === 'object' && !Array.isArray(value)) {
      parts.push(...encodeForm(value as Record<string, unknown>, field));
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === 'object') {
          parts.push(...encodeForm(item as Record<string, unknown>, `${field}[${i}]`));
        } else {
          parts.push(`${encodeURIComponent(`${field}[${i}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else {
      parts.push(`${encodeURIComponent(field)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts;
}

async function stripeFetch(path: string, method: 'GET' | 'POST', body?: Record<string, unknown>) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');

  const res = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? encodeForm(body).join('&') : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Stripe ${method} ${path} failed: ${json?.error?.message ?? res.statusText}`);
  }
  return json;
}

export const stripe = {
  post: (path: string, body: Record<string, unknown>) => stripeFetch(path, 'POST', body),
  get: (path: string) => stripeFetch(path, 'GET'),
};

/**
 * Verify a Stripe webhook signature (scheme: `t=<ts>,v1=<sig>`), returning the
 * parsed event. Throws on a bad/expired signature.
 */
export function verifyWebhook(
  rawBody: string,
  sigHeader: string | undefined,
  secret: string,
  toleranceSec = 300,
): any {
  if (!sigHeader) throw new Error('Missing Stripe-Signature header');
  const parts = Object.fromEntries(
    sigHeader.split(',').map((kv) => {
      const [k, v] = kv.split('=');
      return [k, v];
    }),
  );
  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) throw new Error('Malformed Stripe-Signature header');

  const ageSec = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (ageSec > toleranceSec) throw new Error('Webhook timestamp outside tolerance');

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('Webhook signature verification failed');
  }

  return JSON.parse(rawBody);
}
