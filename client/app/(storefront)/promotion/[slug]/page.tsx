"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgePercent, Check, Copy, UtensilsCrossed } from "lucide-react";

import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/datetime";
import {
  fetchPromotionBySlug,
  isPromotionLive,
  promotionDiscountLabel,
} from "@/features/promotion/services/storefront-promotions";
import type { Promotion } from "@/features/promotion/types/promotion.types";

export default function PromotionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [promotion, setPromotion] = useState<Promotion | null | undefined>(undefined);

  useEffect(() => {
    let off = false;
    fetchPromotionBySlug(slug)
      .then((p) => !off && setPromotion(p))
      .catch(() => !off && setPromotion(null));
    return () => {
      off = true;
    };
  }, [slug]);

  if (promotion === undefined) return <PromotionSkeleton />;

  if (!promotion) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={UtensilsCrossed}
          title="Promotion not found"
          description="This offer may have ended or the link is incorrect."
          action={
            <Button asChild variant="outline">
              <Link href="/">Back to menu</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const live = isPromotionLive(promotion);
  const endsLabel = promotion.endsAt ? formatDate(promotion.endsAt) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-ink text-white">
        {promotion.imageUrl ? (
          <AppImage
            src={promotion.imageUrl}
            alt=""
            fill
            fallbackIcon={BadgePercent}
            className="object-cover opacity-60"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand-deep to-ink" />
        )}
        <div className="relative flex min-h-[220px] flex-col justify-end gap-3 p-6 sm:min-h-[300px] sm:p-10">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-sm font-bold text-primary-foreground shadow-md">
            <BadgePercent className="size-4" />
            {promotionDiscountLabel(promotion, formatCurrency)}
          </span>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{promotion.title}</h1>
          {promotion.description && (
            <p className="max-w-xl text-white/85 sm:text-lg">{promotion.description}</p>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {promotion.minOrderAmount > 0 && (
          <InfoCard label="Minimum order" value={formatCurrency(promotion.minOrderAmount)} />
        )}
        {endsLabel && <InfoCard label="Valid until" value={endsLabel} />}
        {promotion.discountType === "percentage" && promotion.maxDiscountAmount != null && (
          <InfoCard label="Max discount" value={formatCurrency(promotion.maxDiscountAmount)} />
        )}
        {promotion.perCustomerLimit != null && (
          <InfoCard
            label="Per customer"
            value={`${promotion.perCustomerLimit} use${promotion.perCustomerLimit === 1 ? "" : "s"}`}
          />
        )}
      </div>

      {/* Code + CTA */}
      {!live ? (
        <p className="mt-6 rounded-2xl border border-border bg-secondary px-5 py-4 text-center text-sm font-medium text-muted-foreground">
          This promotion is not currently available.
        </p>
      ) : (
        <div className="mt-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          {promotion.code ? (
            <CodeChip code={promotion.code} />
          ) : (
            <p className="text-sm text-muted-foreground">
              <Check className="mr-1 inline size-4 text-emerald-600" />
              Applied automatically at checkout.
            </p>
          )}
          <Button asChild size="lg" className="shrink-0">
            <Link href={promotion.ctaHref || "/"}>
              Start ordering <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

function CodeChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast("Code copied", { tone: "success" });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Couldn't copy the code", { tone: "error" });
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="group inline-flex items-center gap-3 rounded-2xl border-2 border-dashed border-brand/50 bg-brand-tint/50 px-5 py-3 transition-colors hover:bg-brand-tint"
      aria-label={`Copy code ${code}`}
    >
      <span className="font-display text-xl font-bold tracking-wider text-brand-deep">{code}</span>
      <span
        className={cn(
          "flex items-center gap-1 text-xs font-medium",
          copied ? "text-emerald-600" : "text-brand",
        )}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

function PromotionSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <Skeleton className="h-[220px] w-full rounded-3xl sm:h-[300px]" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      <Skeleton className="mt-6 h-14 w-full rounded-2xl" />
    </div>
  );
}
