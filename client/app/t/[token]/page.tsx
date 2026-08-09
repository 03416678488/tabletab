"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, QrCode, UtensilsCrossed, BellRing, Check, ChevronRight } from "lucide-react";
import {
  resolveQrSlug,
  callWaiter,
  type ResolvedQr,
} from "@/features/storefront/services/qr-ordering";
import { toast } from "@/hooks/use-toast";
import { useStorefrontBranches } from "@/features/storefront/hooks/use-storefront-branches";
import { useDineIn } from "@/hooks/use-dine-in";
import { useCart } from "@/hooks/use-cart";
import { useSettings } from "@/features/app-settings/components/settings-provider";
import { useTenant } from "@/hooks/use-tenant";
import { resolveBranding } from "@/lib/theme";
import { isLocalUpload } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SuccessDialog } from "@/components/ui/success-dialog";

/**
 * QR scan landing: resolve `/t/{token}` → a table + branch, then show the guest
 * a choice of what to do (instead of silently dropping them into the menu).
 * Options are added incrementally — dine-in first.
 */
export default function QrLandingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const startDineIn = useDineIn((s) => s.start);
  const setCartBranch = useCart((s) => s.setBranch);
  const clearCart = useCart((s) => s.clear);
  const { branches } = useStorefrontBranches();

  // Real brand identity (Settings → Company / Branding), same source as the
  // storefront header — logo + business name instead of a generic icon.
  const { get } = useSettings();
  const tenant = useTenant();
  const branding = resolveBranding(tenant.branding);
  const businessName = get("company", "name") || tenant.name || "Restaurant";
  const logoSrc = branding.logoDataUrl ?? (get("theme", "logo") || branding.logoUrl || undefined);

  const [resolved, setResolved] = useState<ResolvedQr | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);
  const [called, setCalled] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Resolve the slug once.
  useEffect(() => {
    let cancelled = false;
    resolveQrSlug(token)
      .then((qr) => !cancelled && setResolved(qr))
      .catch(() => !cancelled && setError("This QR code isn't active or no longer exists."));
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Branch: the QR's own branch, or the first branch as a fallback.
  const branchId = useMemo(
    () => resolved?.branchId ?? branches[0]?.id ?? null,
    [resolved, branches],
  );
  const branchName = useMemo(
    () => resolved?.branchName ?? branches.find((b) => b.id === branchId)?.name ?? "Restaurant",
    [resolved, branches, branchId],
  );
  // Table names are often already prefixed ("Table-1"), so don't double it up.
  const tableLabel = (name: string) => (/^\s*table\b/i.test(name) ? name : `Table ${name}`);

  /** Start a dine-in session for this table and open the menu. */
  const startDineInOrder = () => {
    if (!resolved || !branchId) return;
    // Scanning a different table starts a fresh order.
    if (useDineIn.getState().slug && useDineIn.getState().slug !== resolved.slug) {
      clearCart();
    }
    startDineIn({
      slug: resolved.slug,
      branchId,
      branchName,
      tableId: resolved.tableId,
      tableName: resolved.tableName,
    });
    setCartBranch(branchId);
    router.push(`/order/${branchId}`);
  };

  /** Alert staff that this table wants a waiter. */
  const handleCallWaiter = async () => {
    if (!resolved || calling) return;
    // Already requested — just re-show the confirmation so the guest is reassured.
    if (called) {
      setConfirmOpen(true);
      return;
    }
    setCalling(true);
    try {
      await callWaiter(resolved.slug);
      setCalled(true);
      setConfirmOpen(true);
    } catch {
      toast("Couldn't reach a waiter — please try again", { tone: "error" });
    } finally {
      setCalling(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <UtensilsCrossed className="size-7" />
        </div>
        <h1 className="font-display text-xl font-bold text-ink">QR code not recognised</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button asChild className="mt-5">
          <Link href="/">Go to menu</Link>
        </Button>
      </div>
    );
  }

  // Still resolving (or waiting for the branch fallback to load).
  if (!resolved || !branchId) {
    return (
      <div className="px-4 py-24 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-tint text-brand">
          <QrCode className="size-7" />
        </div>
        <p className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Setting up your table…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-brand-tint text-brand ring-1 ring-border">
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt={businessName}
              width={64}
              height={64}
              className="size-full object-contain p-1.5"
              unoptimized={logoSrc.startsWith("data:") || isLocalUpload(logoSrc)}
            />
          ) : (
            <UtensilsCrossed className="size-7" />
          )}
        </div>
        <p className="text-sm font-medium text-muted-foreground">Welcome to {businessName}</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink">
          {tableLabel(resolved.tableName)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {branchName} · What would you like to do?
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {/* Primary — dine-in */}
        <button
          type="button"
          onClick={startDineInOrder}
          className="flex w-full items-center gap-4 rounded-2xl border border-brand bg-brand px-5 py-4 text-left text-primary-foreground shadow-[var(--shadow-card)] transition-colors hover:bg-brand/90"
        >
          <UtensilsCrossed className="size-6 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Start your order</span>
            <span className="block text-sm text-primary-foreground/80">
              Order to this table — served to you
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0" />
        </button>

        {/* Call waiter */}
        <button
          type="button"
          onClick={handleCallWaiter}
          disabled={calling || called}
          className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 text-left text-ink shadow-[var(--shadow-card)] transition-colors hover:bg-secondary disabled:cursor-default disabled:opacity-100 disabled:hover:bg-card"
        >
          {called ? (
            <Check className="size-6 shrink-0 text-emerald-600" />
          ) : calling ? (
            <Loader2 className="size-6 shrink-0 animate-spin text-brand" />
          ) : (
            <BellRing className="size-6 shrink-0 text-brand" />
          )}
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">
              {called ? "A waiter is on the way" : "Call waiter"}
            </span>
            <span className="block text-sm text-muted-foreground">
              {called
                ? "Someone will be with you shortly"
                : "Ask a member of staff to come to your table"}
            </span>
          </span>
        </button>
      </div>

      {/* Waiter-called confirmation — a clear, dismissible modal instead of a
          fleeting toast (easy to miss on a shared table phone). */}
      <SuccessDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        icon={BellRing}
        title="A waiter is on the way"
        description={
          <>
            Someone from {businessName} will come to{" "}
            <span className="font-medium text-ink">{tableLabel(resolved.tableName)}</span> shortly.
            Hang tight!
          </>
        }
      />
    </div>
  );
}
