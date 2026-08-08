"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Plus, Receipt, CreditCard } from "lucide-react";
import {
  getBill,
  requestBill,
  resolveQrSlug,
  type Bill,
} from "@/features/storefront/services/qr-ordering";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useDineIn } from "@/hooks/use-dine-in";
import { useCart } from "@/hooks/use-cart";
import { SuccessDialog } from "@/components/ui/success-dialog";

/** The table's running bill: view the open order + ask staff to take payment. */
export default function BillPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();
  const startDineIn = useDineIn((s) => s.start);
  const setCartBranch = useCart((s) => s.setBranch);

  /** Order another round for this table (re-enters the menu in dine-in mode). */
  const addMore = async () => {
    try {
      const qr = await resolveQrSlug(token);
      if (!qr.branchId) {
        toast("Couldn't open the menu — please re-scan the table QR.", { tone: "error" });
        return;
      }
      startDineIn({
        slug: qr.slug,
        branchId: qr.branchId,
        branchName: qr.branchName ?? "Restaurant",
        tableId: qr.tableId,
        tableName: qr.tableName,
      });
      setCartBranch(qr.branchId);
      router.push(`/order/${qr.branchId}`);
    } catch {
      toast("Couldn't open the menu — please re-scan the table QR.", { tone: "error" });
    }
  };

  useEffect(() => {
    let off = false;
    getBill(token)
      .then((b) => !off && setBill(b))
      .catch(() => !off && setBill(null))
      .finally(() => !off && setLoading(false));
    return () => {
      off = true;
    };
  }, [token]);

  const askToPay = async () => {
    if (requesting) return;
    // Already requested — just re-show the confirmation.
    if (requested) {
      setConfirmOpen(true);
      return;
    }
    setRequesting(true);
    try {
      await requestBill(token);
      setRequested(true);
      setConfirmOpen(true);
    } catch {
      toast("Couldn't reach staff — please try again", { tone: "error" });
    } finally {
      setRequesting(false);
    }
  };

  const back = (
    <Link
      href={`/t/${token}`}
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-ink"
    >
      <ArrowLeft className="size-4" /> Back
    </Link>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24 text-center">
        <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="mx-auto max-w-sm px-4 py-12">
        {back}
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Receipt className="size-7" />
          </div>
          <h1 className="font-display text-xl font-bold text-ink">No open bill</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing has been ordered for this table yet.
          </p>
        </div>
      </div>
    );
  }

  const paid = bill.paymentStatus === "paid";
  const partial = bill.paymentStatus === "partial";

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      {back}

      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display text-lg font-bold text-ink">Your bill</h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              paid
                ? "bg-emerald-50 text-emerald-700"
                : partial
                  ? "bg-blue-50 text-blue-700"
                  : "bg-amber-50 text-amber-700"
            }`}
          >
            {paid ? "Paid" : partial ? "Part-paid" : "Unpaid"}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {bill.tableName ? `Table ${bill.tableName}` : "Your table"}
          {bill.orderCount > 1 ? ` · ${bill.orderCount} orders` : ""}
        </p>

        <ul className="mt-4 space-y-2.5 border-t border-border pt-4">
          {bill.items.map((it, i) => (
            <li key={`${it.name}-${i}`} className="flex items-start justify-between gap-3 text-sm">
              <span className="flex min-w-0 gap-2">
                <span className="font-semibold text-brand">{it.quantity}×</span>
                <span className="min-w-0 text-ink">{it.name}</span>
              </span>
              <span className="shrink-0 tabular-nums text-ink">{formatCurrency(it.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatCurrency(bill.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>Tax</dt>
            <dd className="tabular-nums">{formatCurrency(bill.tax)}</dd>
          </div>
          <div className="flex justify-between pt-1 text-base font-bold text-ink">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCurrency(bill.total)}</dd>
          </div>
          {bill.amountPaid > 0 && (
            <>
              <div className="flex justify-between text-emerald-600">
                <dt>Paid</dt>
                <dd className="tabular-nums">−{formatCurrency(bill.amountPaid)}</dd>
              </div>
              <div className="flex justify-between font-semibold text-ink">
                <dt>Amount due</dt>
                <dd className="tabular-nums">{formatCurrency(bill.amountDue)}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      {/* Order another round for the same table (e.g. drinks after the meal). */}
      <button
        type="button"
        onClick={() => void addMore()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3.5 font-semibold text-ink shadow-[var(--shadow-card)] transition-colors hover:bg-secondary"
      >
        <Plus className="size-5 text-brand" /> Add more items
      </button>

      {bill.amountDue > 0 && (
        <button
          type="button"
          onClick={askToPay}
          disabled={requesting}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-brand bg-brand px-5 py-4 font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-colors hover:bg-brand/90 disabled:opacity-100 disabled:hover:bg-brand"
        >
          {requested ? (
            <>
              <Check className="size-5" /> Bill requested
            </>
          ) : requesting ? (
            <>
              <Loader2 className="size-5 animate-spin" /> Notifying staff…
            </>
          ) : (
            <>
              <CreditCard className="size-5" /> I&apos;m ready to pay
            </>
          )}
        </button>
      )}
      {bill.amountDue > 0 && requested && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          A member of staff will bring your bill and take payment.
        </p>
      )}

      {/* Bill-requested confirmation — clear, dismissible modal (not a toast). */}
      <SuccessDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        icon={CreditCard}
        title="Your bill is on the way"
        description={
          <>
            A member of staff will bring your bill for{" "}
            <span className="font-medium text-ink">
              {formatCurrency(bill.total)}
            </span>{" "}
            and take payment at your table.
          </>
        }
      />
    </div>
  );
}
