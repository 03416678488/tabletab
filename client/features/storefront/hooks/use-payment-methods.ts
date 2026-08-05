"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPaymentMethods, type PaymentMethod } from "@/features/storefront/services/payment-methods";

/** Cached enabled payment methods for the storefront checkout. */
export function usePaymentMethods() {
  const query = useQuery({
    queryKey: ["storefront", "payment-methods"],
    queryFn: fetchPaymentMethods,
    staleTime: 5 * 60_000,
  });
  const methods: PaymentMethod[] = query.data ?? [];
  return { ...query, methods };
}
