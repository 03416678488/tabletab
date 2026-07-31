"use client";

import { useLayoutEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { useSettingsStore } from "@/hooks/use-settings-store";
import {
  brandingCssVars,
  brandingKey,
  DEFAULT_BRANDING,
  mountTenantTheme,
  resolveBranding,
  unmountTenantTheme,
} from "@/lib/theme";
import type { TenantBranding } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ThemeProviderProps {
  children: React.ReactNode;
  className?: string;
  /** Preview-only: styles the wrapper without touching the document root. */
  branding?: TenantBranding;
}

/**
 * Applies tenant brand colors on customer-facing surfaces.
 * Staff /app routes intentionally do not use this provider.
 */
export function ThemeProvider({ children, className, branding: override }: ThemeProviderProps) {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const tenantBranding = useSettingsStore((s) => s.tenant.branding);
  const isPreview = override !== undefined;

  const branding = useMemo(
    () =>
      resolveBranding(
        override ?? (hydrated ? tenantBranding : DEFAULT_BRANDING),
      ),
    [override, hydrated, tenantBranding],
  );

  const brandingSignature = isPreview ? brandingKey(override) : brandingKey(tenantBranding);

  useLayoutEffect(() => {
    if (isPreview) return;

    const apply = () => {
      const current = resolveBranding(useSettingsStore.getState().tenant.branding);
      mountTenantTheme(current);
    };

    apply();

    const unsub = useSettingsStore.subscribe((state, prev) => {
      if (brandingKey(state.tenant.branding) !== brandingKey(prev.tenant.branding)) {
        apply();
      }
      if (!prev.hydrated && state.hydrated) {
        apply();
      }
    });

    const onSaved = () => apply();
    window.addEventListener("tabletap-branding-saved", onSaved);

    return () => {
      unsub();
      window.removeEventListener("tabletap-branding-saved", onSaved);
      unmountTenantTheme();
    };
  }, [isPreview, brandingSignature, hydrated]);

  const style = brandingCssVars(branding) as CSSProperties;

  return (
    <div className={cn("customer-theme min-h-0", className)} style={style}>
      {children}
    </div>
  );
}
