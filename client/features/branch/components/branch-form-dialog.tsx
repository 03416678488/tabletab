"use client";

import { useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ApiError, applyApiErrorToForm } from "@/lib/httpClient";

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
    openingHours: branch?.openingHours ?? "",
    deliveryFee: branch?.deliveryFee ?? undefined,
    minOrder: branch?.minOrder ?? undefined,
    onlineOrderingEnabled: branch?.onlineOrderingEnabled ?? true,
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
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) reset(toDefaults(branch));
  }, [open, branch, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreateBranchInput = {
      name: values.name,
      address: values.address,
      city: values.city,
      phone: values.phone,
      isOpen: values.isOpen,
      onlineOrderingEnabled: values.onlineOrderingEnabled,
      ...(values.imageUrl ? { imageUrl: values.imageUrl } : {}),
      ...(values.openingHours ? { openingHours: values.openingHours } : {}),
      ...(values.deliveryFee !== undefined ? { deliveryFee: values.deliveryFee } : {}),
      ...(values.minOrder !== undefined ? { minOrder: values.minOrder } : {}),
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
          <Field label="Image URL" error={errors.imageUrl?.message}>
            <Input {...register("imageUrl")} placeholder="https://…" />
          </Field>
          <Field label="Opening hours" error={errors.openingHours?.message}>
            <Input {...register("openingHours")} placeholder="Mon–Sun 11:00 – 22:00" />
          </Field>
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
          </div>
          <div className="flex flex-wrap gap-5 pt-1">
            <Toggle label="Open" {...register("isOpen")} />
            <Toggle label="Online ordering" {...register("onlineOrderingEnabled")} />
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
