"use client";

import { OwnerGuard } from "@/components/app/owner-guard";
import { SettingsManager } from "@/components/settings/settings-manager";

export default function SettingsPage() {
  return (
    <OwnerGuard>
      <SettingsManager />
    </OwnerGuard>
  );
}
