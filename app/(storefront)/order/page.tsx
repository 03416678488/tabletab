"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { BranchCard } from "@/components/storefront/branch-card";
import { OrderModePicker, type OrderMode } from "@/components/storefront/order-mode-picker";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { BranchOnlineConfig } from "@/lib/mock/branch-online";
import type { Branch, BranchReservationSettings } from "@/lib/types";

export default function OrderPage() {
  const [mode, setMode] = useState<OrderMode>("delivery");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [onlineConfigs, setOnlineConfigs] = useState<Record<string, BranchOnlineConfig>>({});
  const [reservationSettings, setReservationSettings] = useState<
    Record<string, BranchReservationSettings>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const branchList = await api.getBranches();
        const configs: Record<string, BranchOnlineConfig> = {};
        const resSettings: Record<string, BranchReservationSettings> = {};
        await Promise.all(
          branchList.map(async (b) => {
            const [online, res] = await Promise.all([
              api.getBranchOnlineConfig(b.id),
              api.getReservationSettings(b.id),
            ]);
            configs[b.id] = online;
            resSettings[b.id] = res;
          }),
        );
        if (!cancelled) {
          setBranches(branchList);
          setOnlineConfigs(configs);
          setReservationSettings(resSettings);
        }
      } catch {
        if (!cancelled) setError("Could not load branches. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const modeDescription =
    mode === "reserve"
      ? "Pick a location to reserve a table. Pre-order from the menu if you like."
      : mode === "pickup"
        ? "Select your branch for pickup. Menu and availability vary by location."
        : "Select your branch for delivery. Menu and availability vary by location.";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink">Order online</h1>
        <p className="mt-2 text-muted-foreground">{modeDescription}</p>
      </div>

      <OrderModePicker value={mode} onChange={setMode} />

      <div className="mb-8">
        <h2 className="font-display text-xl font-semibold text-ink">Choose a location</h2>
      </div>

      {loading && (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-4 rounded-2xl border border-border bg-surface p-4">
              <Skeleton className="aspect-[16/9] w-full" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <EmptyState
          icon={MapPin}
          title="Something went wrong"
          description={error}
          action={
            <button
              type="button"
              className="text-sm font-medium text-brand hover:underline"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          }
        />
      )}

      {!loading && !error && branches.length === 0 && (
        <EmptyState
          icon={MapPin}
          title="No branches available"
          description="Check back soon — we're expanding to new locations."
        />
      )}

      {!loading && !error && branches.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {branches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              mode={mode}
              online={onlineConfigs[branch.id] ?? { deliveryAvailable: false, pickupAvailable: true, deliveryFee: 0, deliveryEtaMinutes: 30, pickupSlots: [] }}
              reservationSettings={
                reservationSettings[branch.id] ?? {
                  branchId: branch.id,
                  enabled: true,
                  turnTimeMins: 90,
                  reminderLeadMins: 30,
                  noShowGraceMins: 15,
                  bookingWindowDays: 14,
                  cutoffMins: 60,
                }
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
