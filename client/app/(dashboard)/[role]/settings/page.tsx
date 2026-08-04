"use client";

import { AdminGuard } from "@/features/dashboard/components/admin-guard";
import { SettingsShell } from "@/features/app-settings/components/settings-shell";

export default function SettingsPage() {
  return (
    <AdminGuard>
      <SettingsShell />
    </AdminGuard>
  );
}
