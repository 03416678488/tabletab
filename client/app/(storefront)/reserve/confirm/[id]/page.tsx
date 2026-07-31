"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, Clock, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ReservationStatusPill } from "@/components/ui/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatSlotLabel, formatTime12 } from "@/lib/reservation-utils";
import type { Branch, Reservation, Table } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function ReservationConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const r = await api.getReservation(id);
      if (cancelled) return;
      if (!r) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setReservation(r);
      const b = await api.getBranch(r.branchId);
      if (!cancelled && b) {
        setBranch(b);
        setTable(b.tables.find((t) => t.id === r.tableId) ?? null);
      }
      setLoading(false);
    };
    load();
    const poll = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Skeleton className="mx-auto mb-6 size-16 rounded-full" />
        <Skeleton className="mb-4 h-8 w-3/4" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !reservation) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon={CalendarCheck}
          title="Reservation not found"
          action={
            <Button asChild>
              <Link href="/order">Book a table</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const confirmed = reservation.status === "confirmed" || reservation.status === "seated";

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-16">
      <div className="mb-8 text-center">
        <div
          className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-full ${
            confirmed ? "bg-green-100 text-green-700" : "bg-brand-tint text-brand-deep"
          }`}
        >
          {confirmed ? (
            <CheckCircle2 className="size-8" />
          ) : (
            <Clock className="size-8" />
          )}
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {confirmed ? "You're confirmed!" : "Request received"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {confirmed
            ? "Your table is held for your arrival. See you soon!"
            : "A team member will confirm your reservation shortly."}
        </p>
        <div className="mt-4 flex justify-center">
          <ReservationStatusPill status={reservation.status} />
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              When
            </p>
            <p className="font-display text-lg font-semibold text-ink">
              {formatSlotLabel(reservation.date, reservation.time)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatTime12(reservation.time)} · {reservation.partySize} guests ·{" "}
              {reservation.durationMins} min
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Where
            </p>
            <p className="font-medium text-ink">{branch?.name}</p>
            {table && (
              <p className="text-sm text-muted-foreground">
                Table {table.label} · {table.floor}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Guest
            </p>
            <p className="font-medium text-ink">{reservation.guestName}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="size-3.5" />
              {reservation.guestPhone}
            </p>
          </div>

          {reservation.buffet && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Buffet
              </p>
              <p className="text-sm font-medium text-ink">
                {reservation.buffet.packageName} · {reservation.buffet.totalCovers} covers
              </p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(reservation.buffet.subtotal)}
              </p>
            </div>
          )}

          {reservation.preOrder && reservation.preOrder.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pre-order
              </p>
              <ul className="mt-1 space-y-1 text-sm">
                {reservation.preOrder.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {item.quantity}× {item.name}
                    </span>
                    <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reservation.specialRequests && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Requests
              </p>
              <p className="text-sm text-ink">{reservation.specialRequests}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col gap-3">
        <Button asChild variant="outline">
          <Link href="/order">Back to home</Link>
        </Button>
        {!confirmed && (
          <p className="text-center text-xs text-muted-foreground">
            This page updates automatically when your reservation is confirmed.
          </p>
        )}
      </div>
    </div>
  );
}
