"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WeeklyHoursEditor } from "@/components/ui/weekly-hours-editor";
import { WeeklyHoursBadges } from "@/components/ui/weekly-hours-badges";
import { toast } from "@/hooks/use-toast";
import { ApiError, applyApiErrorToForm, httpClient } from "@/lib/httpClient";
import {
  coerceWeek,
  emptyWeek,
  flatToWeekly,
  type WeeklyHours,
} from "@/lib/opening-hours";
import { ImagePickerField } from "@/features/media/components/image-picker-field";

// Leaflet touches `window`, so the map is loaded client-side only.
const BranchMapPicker = dynamic(
  () => import("@/features/branch/components/branch-map-picker"),
  {
    ssr: false,
    loading: () => <div className="h-56 w-full animate-pulse rounded-xl bg-secondary" />,
  },
);

import {
  branchSchema,
  type BranchFormValues,
} from "@/features/branch/schemas/branch.schema";
import { BRANCH_DEFAULT_CITY } from "@/features/branch/constants/branch.constants";
import { branchService } from "@/features/branch/services/branch.service";
import type {
  Branch,
  CreateBranchInput,
} from "@/features/branch/types/branch.types";

interface BranchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create, a branch = edit. */
  branch: Branch | null;
  onSaved: () => void;
}

/** "" / null → undefined, otherwise a number (for RHF number inputs). */
function toOptionalNumber(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function toDefaults(branch: Branch | null): BranchFormValues {
  return {
    name: branch?.name ?? "",
    address: branch?.address ?? "",
    city: branch?.city ?? BRANCH_DEFAULT_CITY,
    phone: branch?.phone ?? "",
    imageUrl: branch?.imageUrl ?? "",
    isOpen: branch?.isOpen ?? true,
    lat: branch?.lat ?? undefined,
    lng: branch?.lng ?? undefined,
    openingHours: branch?.openingHours ?? null,
    deliveryFee: branch?.deliveryFee ?? undefined,
    minOrder: branch?.minOrder ?? undefined,
    deliveryEtaMinutes: branch?.deliveryEtaMinutes ?? undefined,
    onlineOrderingEnabled: branch?.onlineOrderingEnabled ?? true,
    deliveryEnabled: branch?.deliveryEnabled ?? true,
    pickupEnabled: branch?.pickupEnabled ?? true,
    reservationsEnabled: branch?.reservationsEnabled ?? true,
    reservationTurnMins: branch?.reservationTurnMins ?? undefined,
  };
}

export function BranchFormDialog({
  open,
  onOpenChange,
  branch,
  onSaved,
}: BranchFormDialogProps) {
  const isEdit = !!branch;
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: toDefaults(branch),
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) reset(toDefaults(branch));
  }, [open, branch, reset]);

  // Global opening hours (from settings) — used as the inherited value + seed.
  const [globalWeek, setGlobalWeek] = useState<WeeklyHours>(emptyWeek());
  useEffect(() => {
    httpClient
      .get<Record<string, string>>("/settings/opening_times", { auth: true })
      .then((r) => setGlobalWeek(flatToWeekly(r.data ?? {})))
      .catch(() => undefined);
  }, []);

  // Opening hours: null = inherit the global times; an object = this branch's own.
  const openingHours = watch("openingHours") as WeeklyHours | null;
  const usesGlobal = openingHours == null;
  const toggleCustomHours = (custom: boolean) =>
    setValue("openingHours", custom ? coerceWeek(openingHours ?? globalWeek) : null, {
      shouldDirty: true,
    });

  const lat = watch("lat");
  const lng = watch("lng");
  const setPoint = (nextLat: number, nextLng: number) => {
    setValue("lat", Number(nextLat.toFixed(6)), { shouldDirty: true });
    setValue("lng", Number(nextLng.toFixed(6)), { shouldDirty: true });
  };

  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      toast("Geolocation isn't available", { tone: "error" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPoint(pos.coords.latitude, pos.coords.longitude),
      () => toast("Couldn't get your location", { tone: "error" }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreateBranchInput = {
      name: values.name,
      address: values.address,
      city: values.city,
      phone: values.phone,
      isOpen: values.isOpen,
      onlineOrderingEnabled: values.onlineOrderingEnabled,
      ...(values.imageUrl ? { imageUrl: values.imageUrl } : {}),
      ...(values.lat !== undefined ? { lat: values.lat } : {}),
      ...(values.lng !== undefined ? { lng: values.lng } : {}),
      // null → inherit the global opening times; object → this branch's own hours.
      openingHours: (values.openingHours as WeeklyHours | null) ?? null,
      ...(values.deliveryFee !== undefined ? { deliveryFee: values.deliveryFee } : {}),
      ...(values.minOrder !== undefined ? { minOrder: values.minOrder } : {}),
      ...(values.deliveryEtaMinutes !== undefined
        ? { deliveryEtaMinutes: values.deliveryEtaMinutes }
        : {}),
      deliveryEnabled: values.deliveryEnabled,
      pickupEnabled: values.pickupEnabled,
      reservationsEnabled: values.reservationsEnabled,
      ...(values.reservationTurnMins !== undefined
        ? { reservationTurnMins: values.reservationTurnMins }
        : {}),
    };

    try {
      if (isEdit) {
        await branchService.update(branch!.id, payload);
        toast("Branch updated", { tone: "success" });
      } else {
        await branchService.create(payload);
        toast("Branch created", { tone: "success" });
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      applyApiErrorToForm(err, setError, "name", [
        "name",
        "address",
        "city",
        "phone",
      ]);
      if (!(err instanceof ApiError)) {
        toast("Something went wrong", { tone: "error" });
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit branch" : "Add branch"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this branch's details."
              : "Create a new branch location."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Image" error={errors.imageUrl?.message}>
            <ImagePickerField
              value={watch("imageUrl") ?? ""}
              onChange={(url) => setValue("imageUrl", url, { shouldDirty: true })}
            />
          </Field>
          <Field label="Name" error={errors.name?.message}>
            <Input {...register("name")} aria-invalid={!!errors.name} />
          </Field>
          <Field label="Address" error={errors.address?.message}>
            <Input {...register("address")} aria-invalid={!!errors.address} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City" error={errors.city?.message}>
              <Input {...register("city")} aria-invalid={!!errors.city} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <Input {...register("phone")} aria-invalid={!!errors.phone} />
            </Field>
          </div>
          {/* Location — pan the map under the crosshair, type, or use device GPS. */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Location</Label>
              <button
                type="button"
                onClick={useMyLocation}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                <LocateFixed className="size-3.5" /> Use my location
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Pan the map so the crosshair sits on the exact spot. Used to find each customer&apos;s
              nearest branch.
            </p>
            <BranchMapPicker lat={lat} lng={lng} onChange={setPoint} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Latitude" error={errors.lat?.message}>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 45.5231"
                  {...register("lat", { setValueAs: toOptionalNumber })}
                />
              </Field>
              <Field label="Longitude" error={errors.lng?.message}>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. -122.6765"
                  {...register("lng", { setValueAs: toOptionalNumber })}
                />
              </Field>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Opening hours</Label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="size-4 rounded border-border accent-brand"
                checked={usesGlobal}
                onChange={(e) => toggleCustomHours(!e.target.checked)}
              />
              Use the global opening times
            </label>

            {usesGlobal ? (
              <div className="rounded-xl border border-dashed border-border bg-subtle/50 px-3 py-2.5">
                <WeeklyHoursBadges week={globalWeek} />
              </div>
            ) : (
              <div className="pt-1">
                <p className="mb-2 text-xs text-muted-foreground">Custom hours for this branch:</p>
                <WeeklyHoursEditor
                  value={coerceWeek(openingHours)}
                  onChange={(w) => setValue("openingHours", w, { shouldDirty: true })}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Delivery fee" error={errors.deliveryFee?.message}>
              <Input
                type="number"
                step="0.01"
                {...register("deliveryFee", { setValueAs: toOptionalNumber })}
              />
            </Field>
            <Field label="Min order" error={errors.minOrder?.message}>
              <Input
                type="number"
                step="0.01"
                {...register("minOrder", { setValueAs: toOptionalNumber })}
              />
            </Field>
            <Field label="Delivery ETA (min)" error={errors.deliveryEtaMinutes?.message}>
              <Input
                type="number"
                step="1"
                placeholder="e.g. 30"
                {...register("deliveryEtaMinutes", { setValueAs: toOptionalNumber })}
              />
            </Field>
            <Field label="Reservation turn (min)" error={errors.reservationTurnMins?.message}>
              <Input
                type="number"
                step="5"
                placeholder="e.g. 90"
                {...register("reservationTurnMins", { setValueAs: toOptionalNumber })}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            <Toggle label="Open" {...register("isOpen")} />
            <Toggle label="Online ordering" {...register("onlineOrderingEnabled")} />
            <Toggle label="Delivery" {...register("deliveryEnabled")} />
            <Toggle label="Pickup" {...register("pickupEnabled")} />
            <Toggle label="Reservations" {...register("reservationsEnabled")} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Create branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const Toggle = function Toggle({
  label,
  ...props
}: { label: string } & React.ComponentProps<"input">) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        className="size-4 rounded border-border accent-brand"
        {...props}
      />
      {label}
    </label>
  );
};
