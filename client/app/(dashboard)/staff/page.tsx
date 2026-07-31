"use client";

import { AdminGuard } from "@/features/dashboard/components/admin-guard";
import { StaffManager } from "@/features/staff/components/staff-manager";

export default function StaffPage() {
  return (
    <AdminGuard>
      <StaffManager />
    </AdminGuard>
  );
}
