"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyApiErrorToForm } from "@/lib/httpClient";
import { useBranches } from "@/features/branch/hooks/use-branches";
import { useActiveBranch, ALL_BRANCHES } from "@/features/branch/hooks/use-active-branch";
import { CustomerSelect } from "@/features/customer/components/customer-select";
import type { Customer } from "@/features/customer/types/customer.types";

import {
  eventBookingSchema,
  type EventBookingFormValues,
} from "@/features/event/schemas/event-booking.schema";
import { eventService } from "@/features/event/services/event.service";
import { eventTypeService } from "@/features/event/services/event-type.service";
import type { CreateEventInput, EventType } from "@/features/event/types/event.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const DEFAULTS: EventBookingFormValues = {
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
  source: "phone",
};

export function EventFormDialog({ open, onOpenChange, onSaved }: Props) {
  const { branches } = useBranches();
  const activeBranchId = useActiveBranch((s) => s.activeBranchId);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const form = useForm<EventBookingFormValues>({
    resolver: zodResolver(eventBookingSchema),
    defaultValues: DEFAULTS,
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (!open) return;
    // Default the location to the branch selected in the top nav ("All" → Any).
    const defaultBranchId = activeBranchId && activeBranchId !== ALL_BRANCHES ? activeBranchId : "";
    reset({ ...DEFAULTS, branchId: defaultBranchId });
    setCustomer(null);
  }, [open, reset, activeBranchId]);

  // Event types are per-branch — load the chosen location's catalogue (or all
  // types when no location is set).
  const selectedBranchId = watch("branchId");
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    eventTypeService
      .list({
        isActive: true,
        perPage: 100,
        ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
      })
      .then((res) => {
        if (!cancelled) setEventTypes(res.items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, selectedBranchId]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreateEventInput = {
      title: values.title,
      date: values.date,
      startTime: values.startTime,
      guestCount: Number(values.guestCount),
      guestName: values.guestName,
      guestPhone: values.guestPhone,
      source: values.source,
      ...(values.eventTypeId ? { eventTypeId: values.eventTypeId } : {}),
      ...(values.branchId ? { branchId: values.branchId } : {}),
      ...(values.endTime ? { endTime: values.endTime } : {}),
      ...(values.guestEmail ? { guestEmail: values.guestEmail } : {}),
      ...(values.budget ? { budget: values.budget } : {}),
      ...(values.specialRequests ? { specialRequests: values.specialRequests } : {}),
    };

    try {
      await eventService.create(payload);
      onOpenChange(false);
      onSaved();
    } catch (err) {
      applyApiErrorToForm(err, setError, "title", ["title"]);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
          <DialogDescription>
            Log an event booking taken by phone, walk-in, or on the guest&apos;s behalf.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          className="max-h-[70vh] space-y-4 overflow-y-auto px-0.5"
          noValidate
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Event type</Label>
              <Dropdown
                value={watch("eventTypeId") ?? ""}
                onChange={(v) => setValue("eventTypeId", v, { shouldDirty: true })}
                searchable
                placeholder="— None —"
                aria-label="Event type"
                options={[
                  { value: "", label: "— None —" },
                  ...eventTypes.map((t) => ({ value: t.id, label: t.name })),
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Dropdown
                value={watch("branchId") ?? ""}
                onChange={(v) => {
                  setValue("branchId", v, { shouldDirty: true });
                  // Event types are per-branch — drop a type from another branch.
                  setValue("eventTypeId", "", { shouldDirty: true });
                }}
                searchable
                placeholder="— Any —"
                aria-label="Location"
                options={[
                  { value: "", label: "— Any —" },
                  ...branches.map((b) => ({
                    value: b.id,
                    label: b.name,
                    sublabel: b.city || undefined,
                  })),
                ]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Event title</Label>
            <Input
              {...register("title")}
              placeholder="e.g. Sarah's 30th Birthday"
              aria-invalid={!!errors.title}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" {...register("date")} aria-invalid={!!errors.date} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Start</Label>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Guests</Label>
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
              {errors.budget && <p className="text-xs text-destructive">{errors.budget.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Dropdown
                value={watch("source")}
                onChange={(v) =>
                  setValue("source", v as "online" | "phone" | "walk-in", { shouldDirty: true })
                }
                aria-label="Source"
                options={[
                  { value: "phone", label: "Phone" },
                  { value: "walk-in", label: "Walk-in" },
                  { value: "online", label: "Online" },
                ]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Existing customer (optional)</Label>
            <CustomerSelect
              value={customer}
              onChange={(c) => {
                setCustomer(c);
                if (c) {
                  setValue("guestName", c.name, { shouldDirty: true, shouldValidate: true });
                  setValue("guestPhone", c.phone ?? "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setValue("guestEmail", c.email ?? "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Pick a customer to auto-fill their details, or enter a new guest below.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Guest name</Label>
              <Input {...register("guestName")} aria-invalid={!!errors.guestName} />
              {errors.guestName && (
                <p className="text-xs text-destructive">{errors.guestName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input {...register("guestPhone")} aria-invalid={!!errors.guestPhone} />
              {errors.guestPhone && (
                <p className="text-xs text-destructive">{errors.guestPhone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email (optional)</Label>
            <Input type="email" {...register("guestEmail")} />
            {errors.guestEmail && (
              <p className="text-xs text-destructive">{errors.guestEmail.message}</p>
            )}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Create booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
