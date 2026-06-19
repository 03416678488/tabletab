import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock, MapPin, ShoppingBag, Truck } from "lucide-react";
import type { OrderMode } from "@/components/storefront/order-mode-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import type { BranchOnlineConfig } from "@/lib/mock/branch-online";
import type { Branch, BranchReservationSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BranchCardProps {
  branch: Branch;
  online: BranchOnlineConfig;
  mode: OrderMode;
  reservationSettings: BranchReservationSettings;
}

export function BranchCard({ branch, online, mode, reservationSettings }: BranchCardProps) {
  const canDeliver = branch.isOpen && online.deliveryAvailable;
  const canPickup = branch.isOpen && online.pickupAvailable;
  const canReserve = branch.isOpen && reservationSettings.enabled;

  const available =
    mode === "delivery" ? canDeliver : mode === "pickup" ? canPickup : canReserve;

  const href =
    mode === "reserve" ? `/reserve/${branch.id}` : `/order/${branch.id}`;

  const ctaLabel =
    mode === "reserve"
      ? "Reserve a table"
      : mode === "pickup"
        ? "Order for pickup"
        : "Order for delivery";

  return (
    <Card className={cn("overflow-hidden", !available && "opacity-80")}>
      <div className="relative aspect-[16/9] w-full bg-subtle">
        <Image
          src={branch.imageUrl}
          alt={branch.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <StatusPill tone={branch.isOpen ? "green" : "red"}>
            {branch.isOpen ? "Open now" : "Closed"}
          </StatusPill>
        </div>
      </div>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">{branch.name}</h2>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            {branch.address}, {branch.city}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {online.deliveryAvailable ? (
            <StatusPill tone="brand">
              <Truck className="size-3" />
              Delivery · ~{online.deliveryEtaMinutes} min
            </StatusPill>
          ) : (
            <StatusPill tone="neutral">Delivery unavailable</StatusPill>
          )}
          {online.pickupAvailable ? (
            <StatusPill tone="amber">
              <ShoppingBag className="size-3" />
              Pickup available
            </StatusPill>
          ) : (
            <StatusPill tone="neutral">Pickup unavailable</StatusPill>
          )}
          {reservationSettings.enabled ? (
            <StatusPill tone="blue">
              <CalendarDays className="size-3" />
              Reservations
            </StatusPill>
          ) : (
            <StatusPill tone="neutral">Reservations off</StatusPill>
          )}
        </div>

        {!branch.isOpen && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-4" />
            This location is closed. Check back during service hours.
          </p>
        )}

        {branch.isOpen && mode === "delivery" && !online.deliveryAvailable && (
          <p className="text-sm text-muted-foreground">Delivery is not available at this branch.</p>
        )}
        {branch.isOpen && mode === "pickup" && !online.pickupAvailable && (
          <p className="text-sm text-muted-foreground">Pickup is not available at this branch.</p>
        )}
        {branch.isOpen && mode === "reserve" && !reservationSettings.enabled && (
          <p className="text-sm text-muted-foreground">Table reservations are not enabled here.</p>
        )}

        <Button asChild className="w-full" disabled={!available}>
          {available ? (
            <Link href={href}>{ctaLabel}</Link>
          ) : (
            <span>Unavailable</span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
