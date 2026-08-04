"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SessionSync } from "@/features/dashboard/components/session-sync";
import { SettingsProvider } from "@/features/app-settings/components/settings-provider";
import { I18nProvider } from "@/features/i18n/i18n-provider";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";

export function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient per app instance. Cached data stays fresh for 5 min so
  // navigating away and back doesn't refetch (e.g. the POS item catalog).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5 * 60_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <SessionSync />
        <SettingsProvider>
          <I18nProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </I18nProvider>
        </SettingsProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
