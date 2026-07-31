"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock, Heart, MapPin, Star, Truck } from "lucide-react";
import type { OrderMode } from "@/features/storefront/components/order-mode-picker";
import { Card } from "@/components/ui/card";
import type { BranchOnlineConfig } from "@/lib/mock/branch-online";
import type { Branch, BranchReservationSettings } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

interface BranchCardProps {
  branch: Branch;
  online: BranchOnlineConfig;
  mode: OrderMode;
  reservationSettings: BranchReservationSettings;
}

/** Deterministic rating/reviews from the branch id so cards look real & stable. */
export function pseudoRating(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return {
    rating: (4.2 + (h % 8) / 10).toFixed(1),
    reviews: 200 + (h % 1800),
  };
}

// Cuisine line — the tenant is a single Mediterranean brand, shown foodpanda-style.
const CUISINE_TAGS = "Mediterranean · Pizza · Healthy";

export function BranchCard({ branch, online, mode, reservationSettings }: BranchCardProps) {
  const [favorite, setFavorite] = useState(false);

  const canDeliver = branch.isOpen && online.deliveryAvailable;
  const canPickup = branch.isOpen && online.pickupAvailable;
  const canReserve = branch.isOpen && reservationSettings.enabled;

  const available =
    mode === "delivery" ? canDeliver : mode === "pickup" ? canPickup : canReserve;

  const href = mode === "reserve" ? `/reserve/${branch.id}` : `/order/${branch.id}`;

  const { rating, reviews } = pseudoRating(branch.id);
  const freeDelivery = online.deliveryAvailable && online.deliveryFee === 0;

  // Time badge shown over the image depends on the active mode.
  const timeLabel =
    mode === "reserve"
      ? `${reservationSettings.turnTimeMins} min table`
      : mode === "pickup"
        ? "Ready in ~15 min"
        : online.deliveryAvailable
          ? `${online.deliveryEtaMinutes} min`
          : "Delivery off";

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden transition-all",
        available
          ? "hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
          : "opacity-70",
      )}
    >
      {/* Stretched link — makes the whole card tappable (foodpanda-style). */}
      {available && (
        <Link href={href} className="absolute inset-0 z-0" aria-label={`Open ${branch.name}`}>
          <span className="sr-only">Open {branch.name}</span>
        </Link>
      )}

      <div className="relative aspect-[16/10] w-full overflow-hidden bg-subtle">
        <Image
          src={branch.imageUrl}
          alt={branch.name}
          fill
          className={cn(
            "object-cover transition-transform duration-500 group-hover:scale-105",
            !branch.isOpen && "grayscale",
          )}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />

        {/* Promo ribbon */}
        {freeDelivery && branch.isOpen && (
          <span className="absolute left-0 top-3 rounded-r-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow-sm">
            Free delivery
          </span>
        )}

        {/* Favorite heart */}
        <button
          type="button"
          onClick={() => setFavorite((f) => !f)}
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-surface/90 text-ink shadow-sm backdrop-blur transition-colors hover:bg-surface"
          aria-pressed={favorite}
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={cn("size-4", favorite && "fill-brand text-brand")} />
        </button>

        {/* Time badge */}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm backdrop-blur">
          {mode === "reserve" ? (
            <CalendarDays className="size-3.5 text-brand" />
          ) : (
            <Clock className="size-3.5 text-brand" />
          )}
          {timeLabel}
        </span>

        {!branch.isOpen && (
          <span className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-semibold text-white">
            Closed
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-semibold leading-tight text-ink">
            {branch.name}
          </h2>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
            <Star className="size-3.5 fill-current" />
            {rating}
            <span className="font-normal text-emerald-600/80">({reviews})</span>
          </span>
        </div>

        <p className="truncate text-sm text-muted-foreground">{CUISINE_TAGS}</p>

        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0" />
          <span className="truncate">
            {branch.address}, {branch.city}
          </span>
        </p>

        <div className="mt-auto flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <Truck className="size-4 text-brand" />
          <span className="font-medium text-ink">
            {online.deliveryAvailable
              ? freeDelivery
                ? "Free delivery"
                : `${formatCurrency(online.deliveryFee)} delivery`
              : "Pickup only"}
          </span>
          {typeof branch.minOrder === "number" && branch.minOrder > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>Min {formatCurrency(branch.minOrder)}</span>
            </>
          )}
        </div>

        {!available && branch.isOpen && (
          <p className="text-xs font-medium text-muted-foreground">
            {mode === "delivery"
              ? "Delivery unavailable here"
              : mode === "pickup"
                ? "Pickup unavailable here"
                : "Reservations not enabled"}
          </p>
        )}
      </div>
    </Card>
  );
}
