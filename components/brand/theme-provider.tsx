"use client";

import { useLayoutEffect } from "react";
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
  const savedKey = useSettingsStore((s) => brandingKey(s.tenant.branding));

  const isPreview = override !== undefined;
  const branding = resolveBranding(
    override ?? (hydrated ? useSettingsStore.getState().tenant.branding : DEFAULT_BRANDING),
  );
  const activeKey = isPreview ? brandingKey(override) : savedKey;

  useLayoutEffect(() => {
    if (isPreview) return;

    const applyFromStore = () => {
      const current = resolveBranding(useSettingsStore.getState().tenant.branding);
      mountTenantTheme(current);
    };

    applyFromStore();

    const onSaved = () => applyFromStore();
    window.addEventListener("tabletap-branding-saved", onSaved);

    return () => {
      window.removeEventListener("tabletap-branding-saved", onSaved);
      unmountTenantTheme();
    };
  }, [activeKey, isPreview]);

  const style = brandingCssVars(branding) as CSSProperties;

  return (
    <div className={cn("customer-theme", className)} style={style}>
      {children}
    </div>
  );
}
