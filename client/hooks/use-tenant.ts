"use client";

import { useSettingsStore } from "@/hooks/use-settings-store";
import { TENANT } from "@/lib/mock";
import { DEFAULT_BRANDING, resolveBranding } from "@/lib/theme";
import type { TenantSettings } from "@/lib/types";

const fallbackTenant: TenantSettings = {
  id: TENANT.id,
  name: TENANT.name,
  tagline: TENANT.tagline,
  branding: { ...DEFAULT_BRANDING },
  menuDisplayMode: "simple",
  slaWindowMins: 5,
  currency: "USD",
  taxRate: 8,
  serviceChargePct: 0,
  languages: ["en"],
};

export function useTenant(): TenantSettings {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const tenant = useSettingsStore((s) => s.tenant);
  if (!hydrated) {
    return { ...fallbackTenant, branding: resolveBranding(fallbackTenant.branding) };
  }
  return {
    ...tenant,
    branding: resolveBranding(tenant.branding),
  };
}

export function useTenantBranding() {
  return useTenant().branding;
}

export function useMenuDisplayMode() {
  return useTenant().menuDisplayMode ?? "simple";
}
