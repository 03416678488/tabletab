"use client";

import { OwnerGuard } from "@/components/app/owner-guard";
import { StaffManager } from "@/components/staff/staff-manager";

export default function StaffPage() {
  return (
    <OwnerGuard>
      <StaffManager />
    </OwnerGuard>
  );
}
