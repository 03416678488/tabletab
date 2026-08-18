"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PartyPopper } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { flash } from "@/features/storefront/hooks/use-storefront-flash";
import { ApiError } from "@/lib/httpClient";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Branch } from "@/lib/types";

import {
  eventInquirySchema,
  type EventInquiryFormValues,
} from "@/features/event/schemas/event-inquiry.schema";
import { fetchPublicEventTypes, submitEventInquiry } from "@/features/event/services/event.service";
import { useLocationStore } from "@/hooks/use-location-store";
import { useStorefrontBranches } from "@/features/storefront/hooks/use-storefront-branches";

interface PublicEventType {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: string | null;
}

export function EventInquiryFlow() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [eventTypes, setEventTypes] = useState<PublicEventType[]>([]);
  const [loading, setLoading] = useState(true);

  // Guard direct URL access: block when the selected branch has events off.
  const selectedBranchId = useLocationStore((s) => s.branchId);
  const { branches: liveBranches } = useStorefrontBranches();
  const eventsOff =
    !!selectedBranchId &&
    liveBranches.find((b) => b.id === selectedBranchId)?.eventsEnabled === false;

  const form = useForm<EventInquiryFormValues>({
    resolver: zodResolver(eventInquirySchema),
    defaultValues: {
      eventTypeId: "",
      branchId: "",
      title: "",
      date: "",
      startTime: "",
      endTime: "",
      guestCount: "10",
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      budget: "",
      specialRequests: "",
    },
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bs, ets] = await Promise.all([api.getBranches(), fetchPublicEventTypes()]);
        if (cancelled) return;
        setBranches(bs);
        setEventTypes(ets.items ?? []);
        if (bs.length === 1) setValue("branchId", bs[0].id);
      } catch {
        if (!cancelled) flash("Couldn't load event options", { tone: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setValue]);

  const selectedType = useMemo(
    () => eventTypes.find((t) => t.id === watch("eventTypeId")),
    [eventTypes, watch],
  );

  const onSubmit = handleSubmit(async (values) => {
    try {
      const booking = await submitEventInquiry({
        eventTypeId: values.eventTypeId,
        branchId: values.branchId,
        title: values.title,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime || undefined,
        guestCount: Number(values.guestCount),
        guestName: values.guestName,
        guestPhone: values.guestPhone,
        guestEmail: values.guestEmail || undefined,
        budget: values.budget || undefined,
        specialRequests: values.specialRequests || undefined,
        source: "online",
      });
      router.push(`/events/confirm/${booking.id}`);
    } catch (err) {
      flash(err instanceof ApiError ? err.message : "Couldn't submit your inquiry", {
        tone: "error",
      });
    }
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Skeleton className="mb-6 h-8 w-56" />
        <Skeleton className="h-[28rem] w-full rounded-2xl" />
      </div>
    );
  }

  if (eventsOff) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <PartyPopper className="mx-auto mb-4 size-12 text-brand" />
        <h1 className="font-display text-2xl font-bold text-ink">
          Event bookings aren&apos;t available
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This location isn&apos;t taking event bookings right now. Please check back later.
        </p>
      </div>
    );
  }

  if (eventTypes.length === 0 || branches.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <PartyPopper className="mx-auto mb-4 size-12 text-brand" />
        <h1 className="font-display text-2xl font-bold text-ink">Events coming soon</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Private event bookings aren&apos;t available just yet. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-brand-tint text-brand-deep">
          <PartyPopper className="size-7" />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">Book an event</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Birthdays, weddings, corporate get-togethers — tell us what you have in mind and
          we&apos;ll be in touch to confirm the details.
        </p>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label required>Event type</Label>
              <Dropdown
                value={watch("eventTypeId") ?? ""}
                onChange={(v) =>
                  setValue("eventTypeId", v, { shouldDirty: true, shouldValidate: true })
                }
                searchable
                placeholder="Select an event type…"
                aria-label="Event type"
                options={eventTypes.map((t) => ({ value: t.id, label: t.name }))}
              />
              {selectedType?.basePrice && (
                <p className="text-xs text-muted-foreground">
                  From {formatCurrency(Number(selectedType.basePrice))}
                </p>
              )}
              {errors.eventTypeId && (
                <p className="text-xs text-destructive">{errors.eventTypeId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label required>Location</Label>
              <Dropdown
                value={watch("branchId") ?? ""}
                onChange={(v) =>
                  setValue("branchId", v, { shouldDirty: true, shouldValidate: true })
                }
                searchable
                placeholder="Select a location…"
                aria-label="Location"
                options={branches.map((b) => ({
                  value: b.id,
                  label: b.name,
                  sublabel: b.city || undefined,
                }))}
              />
              {errors.branchId && (
                <p className="text-xs text-destructive">{errors.branchId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label required>Event title</Label>
              <Input
                {...register("title")}
                placeholder="e.g. Sarah's 30th Birthday"
                aria-invalid={!!errors.title}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label required>Date</Label>
                <Input type="date" {...register("date")} aria-invalid={!!errors.date} />
                {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label required>Start</Label>
                <Input type="time" {...register("startTime")} aria-invalid={!!errors.startTime} />
                {errors.startTime && (
                  <p className="text-xs text-destructive">{errors.startTime.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>End (optional)</Label>
                <Input type="time" {...register("endTime")} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label required>Number of guests</Label>
                <Input
                  type="number"
                  min={1}
                  {...register("guestCount")}
                  aria-invalid={!!errors.guestCount}
                />
                {errors.guestCount && (
                  <p className="text-xs text-destructive">{errors.guestCount.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Budget (optional)</Label>
                <Input {...register("budget")} placeholder="0.00" inputMode="decimal" />
                {errors.budget && (
                  <p className="text-xs text-destructive">{errors.budget.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label required>Your name</Label>
                <Input {...register("guestName")} aria-invalid={!!errors.guestName} />
                {errors.guestName && (
                  <p className="text-xs text-destructive">{errors.guestName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label required>Phone</Label>
                <Input {...register("guestPhone")} aria-invalid={!!errors.guestPhone} />
                {errors.guestPhone && (
                  <p className="text-xs text-destructive">{errors.guestPhone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label required>Email</Label>
              <Input type="email" {...register("guestEmail")} aria-invalid={!!errors.guestEmail} />
              {errors.guestEmail && (
                <p className="text-xs text-destructive">{errors.guestEmail.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                We&apos;ll email your booking details and status updates here — no account needed.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Special requests (optional)</Label>
              <textarea
                {...register("specialRequests")}
                rows={3}
                placeholder="Decorations, dietary needs, seating preferences…"
                className="w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Submit inquiry
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
