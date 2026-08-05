import { httpClient } from "@/lib/httpClient";

export interface PaymentMethod {
  id: string;
  label: string;
  enabled: boolean;
  /** Publishable key (Stripe) or client id (PayPal) — never a secret. */
  publicKey?: string;
  /** Cash-on-delivery instructions. */
  instructions?: string;
}

/** Enabled storefront payment methods (public — no secret keys). */
export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const res = await httpClient.get<PaymentMethod[]>("/settings/payment-methods");
  return res.data ?? [];
}
