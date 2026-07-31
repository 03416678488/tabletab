"use client";

import { AdminGuard } from "@/features/dashboard/components/admin-guard";
import { SettingsManager } from "@/features/settings/components/settings-manager";

export default function SettingsPage() {
  return (
    <AdminGuard>
      <SettingsManager />
    </AdminGuard>
  );
}
