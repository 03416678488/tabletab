"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, QrCode, UtensilsCrossed } from "lucide-react";
import {
  resolveQrSlug,
  type ResolvedQr,
} from "@/features/storefront/services/qr-ordering";
import { useStorefrontBranches } from "@/features/storefront/hooks/use-storefront-branches";
import { useDineIn } from "@/hooks/use-dine-in";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";

/** Scan landing: resolve `/t/{slug}` → start a dine-in session and drop the
    customer into that branch's menu. */
export default function QrLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const startDineIn = useDineIn((s) => s.start);
  const setCartBranch = useCart((s) => s.setBranch);
  const clearCart = useCart((s) => s.clear);
  const { branches } = useStorefrontBranches();

  const [resolved, setResolved] = useState<ResolvedQr | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Once resolved (and branches loaded for the fallback), start the session and
  // redirect into the branch menu.
  const startedRef = useRef(false);
  useEffect(() => {
    if (!resolved || startedRef.current) return;
    const branchId = resolved.branchId ?? branches[0]?.id ?? null;
    if (!branchId) return; // wait for branches to load for the fallback
    startedRef.current = true;

    const branchName =
      resolved.branchName ?? branches.find((b) => b.id === branchId)?.name ?? "Restaurant";
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
    router.replace(`/order/${branchId}`);
  }, [resolved, branches, startDineIn, setCartBranch, clearCart, router]);

  if (error) {
    return (
      <div className="max-w-sm text-center">
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

  return (
    <div className="text-center">
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
