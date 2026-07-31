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
import { ROLE_LABELS } from "@/lib/nav";

import { useBranches } from "@/features/branch/hooks/use-branches";
import {
  staffSchema,
  type StaffFormValues,
} from "@/features/staff/schemas/staff.schema";
import { STAFF_ROLES } from "@/features/staff/constants/staff.constants";
import { staffService } from "@/features/staff/services/staff.service";
import type {
  CreateStaffInput,
  Staff,
} from "@/features/staff/types/staff.types";

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Staff | null;
  onSaved: () => void;
}

function toDefaults(staff: Staff | null): StaffFormValues {
  return {
    firstName: staff?.firstName ?? "",
    lastName: staff?.lastName ?? "",
    email: staff?.email ?? "",
    phone: staff?.phone ?? "",
    role: staff?.role ?? "waiter",
    branchId: staff?.branchId ?? "",
    avatarUrl: staff?.avatarUrl ?? "",
    isActive: staff?.isActive ?? true,
  };
}

export function StaffFormDialog({
  open,
  onOpenChange,
  staff,
  onSaved,
}: StaffFormDialogProps) {
  const isEdit = !!staff;
  const { branches } = useBranches();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: toDefaults(staff),
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) reset(toDefaults(staff));
  }, [open, staff, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreateStaffInput = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      role: values.role,
      isActive: values.isActive,
      ...(values.phone ? { phone: values.phone } : {}),
      ...(values.branchId ? { branchId: values.branchId } : {}),
      ...(values.avatarUrl ? { avatarUrl: values.avatarUrl } : {}),
    };

    try {
      if (isEdit) {
        await staffService.update(staff!.id, payload);
        toast("Staff updated", { tone: "success" });
      } else {
        await staffService.create(payload);
        toast("Staff created", { tone: "success" });
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      applyApiErrorToForm(err, setError, "email", [
        "firstName",
        "lastName",
        "email",
        "branchId",
      ]);
      if (!(err instanceof ApiError)) {
        toast("Something went wrong", { tone: "error" });
      }
    }
  });

  const selectClass =
    "h-10 w-full appearance-none rounded-xl border border-input bg-white px-3.5 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit staff" : "Add staff"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this staff member's details."
              : "Add a new team member."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name" error={errors.firstName?.message}>
              <Input {...register("firstName")} aria-invalid={!!errors.firstName} />
            </Field>
            <Field label="Last name" error={errors.lastName?.message}>
              <Input {...register("lastName")} aria-invalid={!!errors.lastName} />
            </Field>
          </div>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} aria-invalid={!!errors.email} />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <Input {...register("phone")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Role" error={errors.role?.message}>
              <select className={selectClass} {...register("role")}>
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Branch" error={errors.branchId?.message}>
              <select className={selectClass} {...register("branchId")}>
                <option value="">— No branch —</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Avatar URL" error={errors.avatarUrl?.message}>
            <Input {...register("avatarUrl")} placeholder="https://…" />
          </Field>
          <label className="flex items-center gap-2 pt-1 text-sm text-ink">
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-brand"
              {...register("isActive")}
            />
            Active
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Create staff"}
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
