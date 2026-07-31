"use client";

import { useState } from "react";
import { Building2, Mail, Pencil, Plus, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";
import { ROLE_LABELS } from "@/lib/nav";
import type { StaffRole } from "@/lib/types";

import { useStaff } from "@/features/staff/hooks/use-staff";
import { staffService } from "@/features/staff/services/staff.service";
import { StaffFormDialog } from "@/features/staff/components/staff-form-dialog";
import type { Staff } from "@/features/staff/types/staff.types";

const ROLE_TONE: Record<StaffRole, "brand" | "blue" | "purple" | "amber"> = {
  admin: "brand",
  manager: "blue",
  chef: "purple",
  waiter: "amber",
};

export function StaffManager() {
  const { staff, loading, error, refetch } = useStaff();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (member: Staff) => {
    setEditing(member);
    setDialogOpen(true);
  };

  const remove = async (member: Staff) => {
    if (!confirm(`Remove ${member.firstName} ${member.lastName}?`)) return;
    try {
      await staffService.remove(member.id);
      toast("Staff removed", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to remove staff", {
        tone: "error",
      });
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Staff
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {staff.filter((s) => s.isActive).length} active team members.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> Add staff
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : error ? (
          <EmptyState
            icon={Users}
            title="Couldn't load staff"
            description={error}
            action={
              <Button variant="outline" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : staff.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff yet"
            description="Add your first team member to get started."
            action={
              <Button onClick={openCreate}>
                <Plus /> Add staff
              </Button>
            }
          />
        ) : (
          staff.map((member) => (
            <Card key={member.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-brand-tint text-xs font-semibold text-brand-deep">
                  {(member.firstName[0] ?? "") + (member.lastName[0] ?? "")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-ink">
                      {member.firstName} {member.lastName}
                    </p>
                    <StatusPill tone={ROLE_TONE[member.role]}>
                      {ROLE_LABELS[member.role]}
                    </StatusPill>
                    {!member.isActive && (
                      <StatusPill tone="neutral">Inactive</StatusPill>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3.5" /> {member.email}
                    </span>
                    {member.branch && (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="size-3.5" /> {member.branch.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit"
                    onClick={() => openEdit(member)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove"
                    onClick={() => remove(member)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <StaffFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={editing}
        onSaved={refetch}
      />
    </div>
  );
}
