"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, UtensilsCrossed } from "lucide-react";
import { ReservationBookingFlow } from "@/features/reserve/components/reservation-booking-flow";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStorefrontBranch } from "@/features/storefront/services/storefront-branches";
import {
  fetchReservationConfig,
  type ReservationConfig,
} from "@/features/reserve/services/reservation-config.service";
import type { Branch } from "@/lib/types";

export default function ReserveBranchPage({ params }: { params: Promise<{ branchId: string }> }) {
  const { branchId } = use(params);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [settings, setSettings] = useState<ReservationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [b, s] = await Promise.all([
          fetchStorefrontBranch(branchId),
          fetchReservationConfig(),
        ]);
        if (!cancelled) {
          if (!b) setError("Branch not found");
          else if (b.reservationsEnabled === false)
            setError("Reservations are not available at this location.");
          else if (!s.configured)
            setError("Reservations aren't configured yet. Please check back soon.");
          else {
            setBranch(b);
            setSettings(s);
          }
        }
      } catch {
        if (!cancelled) setError("Could not load reservation options.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [branchId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !branch || !settings) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon={error?.includes("not available") ? MapPin : UtensilsCrossed}
          title={error ?? "Unavailable"}
          action={
            <Button asChild>
              <Link href="/">Back to order options</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <ReservationBookingFlow branch={branch} config={settings} />;
}
