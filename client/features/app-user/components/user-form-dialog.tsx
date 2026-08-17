"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { appUserService } from "@/features/app-user/services/app-user.service";
import { userSchema, type UserFormValues } from "@/features/app-user/schemas/app-user.schema";
import type { AppUser } from "@/features/app-user/types/app-user.types";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Being edited, or null for a new user. */
  user: AppUser | null;
  /** Role assigned to users on this screen (e.g. "Waiter"). */
  roleName?: string;
  /** Whether this role needs a home branch. */
  showBranch: boolean;
  onSaved: () => void;
}

function toDefaults(user: AppUser | null): UserFormValues {
  return {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phoneNumber: user?.phone ?? "",
    password: "",
    branchId: user?.branchId ?? "",
    isActive: user?.isActive ?? true,
  };
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  roleName,
  showBranch,
  onSaved,
}: UserFormDialogProps) {
  const isEdit = !!user;
  const { branches } = useBranches();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema(isEdit)),
    defaultValues: toDefaults(user),
  });

  useEffect(() => {
    if (open) reset(toDefaults(user));
  }, [open, user, reset]);

  const branchId = watch("branchId") ?? "";
  const isActive = watch("isActive");

  const onSubmit = handleSubmit(async (values) => {
    if (showBranch && !values.branchId) {
      setError("branchId", { message: "A branch is required for this role." });
      return;
    }

    try {
      if (isEdit) {
        await appUserService.update(user!.id, {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          isActive: values.isActive,
          branchId: showBranch ? values.branchId || null : null,
          ...(values.password ? { password: values.password } : {}),
        });
      } else {
        await appUserService.create({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          password: values.password ?? "",
          roleName,
          ...(showBranch && values.branchId ? { branchId: values.branchId } : {}),
        });
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      applyApiErrorToForm(err, setError, "email", [
        "firstName",
        "lastName",
        "email",
        "phoneNumber",
      ]);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this user's details." : `Create a new ${roleName ?? "user"} account.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label required>First name</Label>
              <Input {...register("firstName")} aria-invalid={!!errors.firstName} />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label required>Last name</Label>
              <Input {...register("lastName")} aria-invalid={!!errors.lastName} />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label required>Email</Label>
            <Input type="email" {...register("email")} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label required>Phone</Label>
            <Input {...register("phoneNumber")} aria-invalid={!!errors.phoneNumber} />
            {errors.phoneNumber && (
              <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label required={!isEdit}>{isEdit ? "New password" : "Password"}</Label>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder={isEdit ? "Leave blank to keep current" : ""}
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {showBranch && (
            <div className="space-y-1.5">
              <Label required>Branch</Label>
              <Dropdown
                value={branchId}
                onChange={(v) => setValue("branchId", v, { shouldDirty: true })}
                searchable={branches.length > 8}
                placeholder="Select a branch…"
                aria-label="Branch"
                options={branches.map((b) => ({ value: b.id, label: b.name }))}
              />
              {errors.branchId && (
                <p className="text-xs text-destructive">{errors.branchId.message}</p>
              )}
            </div>
          )}

          {isEdit && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-input"
                checked={isActive}
                onChange={(e) => setValue("isActive", e.target.checked, { shouldDirty: true })}
              />
              Active
            </label>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Save changes" : "Add user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
