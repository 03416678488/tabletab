"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, UtensilsCrossed } from "lucide-react";
import { ReservationBookingFlow } from "@/components/reserve/reservation-booking-flow";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { Branch, BranchReservationSettings } from "@/lib/types";

export default function ReserveBranchPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = use(params);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [settings, setSettings] = useState<BranchReservationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [b, s] = await Promise.all([
          api.getBranch(branchId),
          api.getReservationSettings(branchId),
        ]);
        if (!cancelled) {
          if (!b) setError("Branch not found");
          else if (!s.enabled) setError("Reservations are not available at this location.");
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
              <Link href="/order">Back to order options</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <ReservationBookingFlow branch={branch} settings={settings} />;
}
