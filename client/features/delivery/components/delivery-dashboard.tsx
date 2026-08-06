"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Bike, CheckCircle2, Package, PackageCheck, Truck, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { formatCurrency } from "@/lib/utils";
import { StatTile } from "@/features/dashboard/components/stat-tile";
import { useDeliveryQueue } from "@/features/delivery/hooks/use-delivery-queue";

export function DeliveryDashboard() {
  const role = useParams<{ role: string }>().role;
  const { ready, outForDelivery, deliveredToday, collectedToday, recentDelivered } =
    useDeliveryQueue();

  const activeCount = ready.length + outForDelivery.length;

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
            <Bike className="size-5 text-brand" /> Delivery overview
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Your delivery record at a glance.</p>
        </div>
        <Button asChild>
          <Link href={`/${role}/deliveries`}>
            <Truck className="size-4" /> Active deliveries
            {activeCount > 0 && (
              <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs font-semibold">
                {activeCount}
              </span>
            )}
          </Link>
        </Button>
      </div>

      {/* Today's record */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={PackageCheck} label="Delivered today" value={deliveredToday} tone="green" />
        <StatTile icon={Wallet} label="Collected today" value={formatCurrency(collectedToday)} tone="green" />
        <StatTile icon={Truck} label="Out for delivery" value={outForDelivery.length} tone="blue" />
        <StatTile icon={Package} label="Ready to pick up" value={ready.length} tone="brand" />
      </div>

      {/* Active work prompt */}
      {activeCount > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-brand/30 bg-brand-tint/30 p-4">
          <p className="text-sm font-medium text-brand-deep">
            You have {activeCount} active {activeCount === 1 ? "delivery" : "deliveries"} to handle.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href={`/${role}/deliveries`}>
              Go to deliveries <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Card>
      )}

      {/* Delivered history */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display font-semibold text-ink">
          <CheckCircle2 className="size-4 text-emerald-600" /> Recently delivered
        </h2>
        {recentDelivered.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={PackageCheck}
              title="No deliveries yet"
              description="Completed deliveries will be logged here."
            />
          </Card>
        ) : (
          <Card className="divide-y divide-border p-0">
            {recentDelivered.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {o.orderNumber}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {o.customerName ?? "Customer"}
                    </span>
                  </p>
                  {o.customerAddress && (
                    <p className="truncate text-xs text-muted-foreground">{o.customerAddress}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3 text-right">
                  <span className="text-sm font-medium text-ink">{formatCurrency(o.total)}</span>
                  <StatusPill tone={o.paymentStatus === "paid" ? "green" : "amber"}>
                    {o.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                  </StatusPill>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {new Date(o.updatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
