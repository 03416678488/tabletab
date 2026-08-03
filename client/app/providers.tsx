"use client";

import { SessionProvider } from "next-auth/react";

import { SessionSync } from "@/features/dashboard/components/session-sync";
import { SettingsProvider } from "@/features/app-settings/components/settings-provider";
import { I18nProvider } from "@/features/i18n/i18n-provider";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionSync />
      <SettingsProvider>
        <I18nProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </I18nProvider>
      </SettingsProvider>
    </SessionProvider>
  );
}
