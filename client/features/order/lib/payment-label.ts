import { formatMoney } from "@/lib/currency";
import type { PaymentResult } from "@/features/order/components/payment-dialog";

/** Human-readable payment method label stored on the order (for receipts/reports). */
export function paymentMethodLabel(p: PaymentResult): string {
  switch (p.method) {
    case "cash":
      return `Cash · Received ${formatMoney(p.received ?? 0)}${
        p.change ? ` · Change ${formatMoney(p.change)}` : ""
      }`;
    case "card":
      return `Card ****${p.detail}`;
    case "mfs":
      return `MFS · Txn ${p.detail}`;
    default:
      return `Other · ${p.detail}`;
  }
}
