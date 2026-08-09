"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, Clock, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

import { fetchEventBooking } from "@/features/event/services/event.service";
import type { EventBooking, EventStatus } from "@/features/event/types/event.types";

const STATUS_TONE: Record<EventStatus, "amber" | "green" | "blue" | "red"> = {
  requested: "amber",
  confirmed: "blue",
  completed: "green",
  cancelled: "red",
};
const STATUS_LABEL: Record<EventStatus, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function EventConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [booking, setBooking] = useState<EventBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const b = await fetchEventBooking(id);
      if (cancelled) return;
      if (!b) setNotFound(true);
      else setBooking(b);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
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

  if (notFound || !booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon={CalendarCheck}
          title="Booking not found"
          action={
            <Button asChild>
              <Link href="/events">Book an event</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const confirmed = booking.status === "confirmed" || booking.status === "completed";

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-16">
      <div className="mb-8 text-center">
        <div
          className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-full ${
            confirmed ? "bg-green-100 text-green-700" : "bg-brand-tint text-brand-deep"
          }`}
        >
          {confirmed ? <CheckCircle2 className="size-8" /> : <Clock className="size-8" />}
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {confirmed ? "You're confirmed!" : "Inquiry received"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {confirmed
            ? "Your event is booked. We can't wait to host you!"
            : "Thanks! Our team will reach out shortly to confirm the details."}
        </p>
        <div className="mt-4 flex justify-center">
          <StatusPill tone={STATUS_TONE[booking.status]}>{STATUS_LABEL[booking.status]}</StatusPill>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Event
            </p>
            <p className="font-display text-lg font-semibold text-ink">{booking.title}</p>
            <p className="text-sm text-muted-foreground">
              {booking.eventType?.name ?? "Event"} · {booking.guestCount} guests
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              When
            </p>
            <p className="font-medium text-ink">{booking.date}</p>
            <p className="text-sm text-muted-foreground">
              {booking.startTime}
              {booking.endTime ? ` – ${booking.endTime}` : ""}
            </p>
          </div>

          {booking.branch?.name && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Where
              </p>
              <p className="font-medium text-ink">{booking.branch.name}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Guest
            </p>
            <p className="font-medium text-ink">{booking.guestName}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="size-3.5" />
              {booking.guestPhone}
            </p>
          </div>

          {booking.budget && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Budget
              </p>
              <p className="text-sm font-medium text-ink">
                {formatCurrency(Number(booking.budget))}
              </p>
            </div>
          )}

          {booking.status === "cancelled" && booking.cancellationReason && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Cancellation reason
              </p>
              <p className="text-sm text-ink">{booking.cancellationReason}</p>
            </div>
          )}

          {booking.specialRequests && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Requests
              </p>
              <p className="text-sm text-ink">{booking.specialRequests}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
