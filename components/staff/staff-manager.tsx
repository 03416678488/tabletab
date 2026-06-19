"use client";

import Image from "next/image";
import { useState } from "react";
import { Plus, UserPlus, Users } from "lucide-react";
import { StaffInviteSheet } from "@/components/staff/staff-invite-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { useSettingsStore } from "@/hooks/use-settings-store";
import { useStaffStore } from "@/hooks/use-staff-store";
import { toast } from "@/hooks/use-toast";
import { ROLE_LABELS } from "@/lib/nav";

const ROLE_TONE = {
  owner: "brand" as const,
  manager: "blue" as const,
  chef: "purple" as const,
  waiter: "amber" as const,
};

export function StaffManager() {
  const hydrated = useStaffStore((s) => s.hydrated);
  const staff = useStaffStore((s) => s.staff);
  const inviteStaff = useStaffStore((s) => s.inviteStaff);
  const toggleActive = useStaffStore((s) => s.toggleActive);
  const branches = useSettingsStore((s) => s.branches);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Staff</h1>
          <p className="text-sm text-muted-foreground">
            {staff.filter((s) => s.active !== false).length} active sub-accounts
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="size-4" />
          Invite staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff yet"
          description="Invite team members to give them access to branch operations."
          action={
            <Button onClick={() => setSheetOpen(true)}>
              <UserPlus className="size-4" />
              Invite staff
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {staff.map((member) => {
            const active = member.active !== false;
            return (
              <Card key={member.id} className={!active ? "opacity-60" : undefined}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    {member.avatarUrl && (
                      <Image
                        src={member.avatarUrl}
                        alt=""
                        width={44}
                        height={44}
                        className="size-11 rounded-full border border-border object-cover"
                        unoptimized
                      />
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{member.name}</p>
                        <StatusPill tone={ROLE_TONE[member.role]} dot={false}>
                          {ROLE_LABELS[member.role]}
                        </StatusPill>
                        {!active && (
                          <StatusPill tone="neutral" dot={false}>
                            Deactivated
                          </StatusPill>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  {member.role !== "owner" && (
                    <Button
                      variant={active ? "outline" : "default"}
                      size="sm"
                      onClick={() => {
                        toggleActive(member.id);
                        toast(active ? "Account deactivated" : "Account activated", {
                          tone: "success",
                        });
                      }}
                    >
                      {active ? "Deactivate" : "Activate"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </ul>
      )}

      <StaffInviteSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        branches={branches}
        onInvite={(input) => {
          inviteStaff(input);
          toast("Invite sent (demo)", { tone: "success" });
        }}
      />
    </div>
  );
}
