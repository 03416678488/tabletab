"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { setCurrencyConfig } from "@/lib/currency";
import { setDateTimeConfig } from "@/lib/datetime";
import { setAppDebug } from "@/lib/app-flags";
import { brandingCssVars, resolveBranding } from "@/lib/theme";
import { settingsService } from "@/features/app-settings/services/settings.service";
import type { CurrencyRow, SettingsGroups } from "@/features/app-settings/types/settings.types";

interface SettingsContextValue {
  settings: SettingsGroups;
  currencies: CurrencyRow[];
  loading: boolean;
  /** Look up a single value, e.g. get("company", "name"). */
  get: (group: string, key: string) => string;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** Applies the configured currency (symbol/position/decimals) to formatMoney. */
function applyCurrency(settings: SettingsGroups, currencies: CurrencyRow[]) {
  const site = settings.site ?? {};
  const code = site.default_currency || "USD";
  const match = currencies.find((c) => c.code === code);
  setCurrencyConfig({
    symbol: match?.symbol ?? "$",
    position: site.currency_position === "right" ? "right" : "left",
    decimals: Number(site.digit_after_decimal ?? 2) || 0,
  });
}

/** Applies the configured date/time format + timezone to formatDate/formatTime. */
function applyDateTime(settings: SettingsGroups) {
  const site = settings.site ?? {};
  setDateTimeConfig({
    dateFormat: site.date_format || "DD-MM-YYYY",
    timeFormat: site.time_format || "hh:mm A",
    timezone: site.default_timezone || undefined,
  });
}

/** Applies the configured brand color to the runtime theme CSS variables. */
function applyTheme(settings: SettingsGroups) {
  const color = settings.theme?.primary_color;
  if (!color || typeof document === "undefined") return;
  // Apply the full brand token set (shades + readable foreground) from the
  // admin's configured colour — the single source of truth for the whole app.
  const vars = brandingCssVars(resolveBranding({ primaryColor: color }));
  const root = document.documentElement.style;
  for (const [key, value] of Object.entries(vars)) root.setProperty(key, value);
}

/**
 * Swaps the browser-tab favicon to the one uploaded in Settings → Theme.
 *
 * Only manages a single link element WE own (tagged `data-app-favicon`) and
 * appends it last so it wins. Never removes React/Next-owned `<link rel="icon">`
 * nodes — doing so detaches DOM that React still tracks and crashes the
 * reconciler with "removeChild … parentNode is null".
 */
const APP_FAVICON_MARK = "data-app-favicon";

function applyFavicon(settings: SettingsGroups) {
  const fav = settings.theme?.fav_icon;
  if (!fav || typeof document === "undefined") return;
  const existing = document.head.querySelector<HTMLLinkElement>(`link[${APP_FAVICON_MARK}]`);
  if (existing?.getAttribute("href") === fav) return; // already applied
  // Safe: this node was created by us via createElement, so React never tracks it.
  existing?.remove();
  const link = document.createElement("link");
  link.rel = "icon";
  link.setAttribute(APP_FAVICON_MARK, "");
  link.href = fav;
  document.head.appendChild(link);
}

/** Sets the browser-tab title to the business name (whitelabel). */
function applyTitle(settings: SettingsGroups) {
  const name = settings.company?.name?.trim();
  if (!name || typeof document === "undefined") return;
  document.title = name;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsGroups>({});
  const [currencies, setCurrencies] = useState<CurrencyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([settingsService.getPublic(), settingsService.currencies()]);
      setSettings(s);
      setCurrencies(c);
      applyCurrency(s, c);
      applyDateTime(s);
      setAppDebug((s.site?.app_debug ?? "disable") === "enable");
      applyTheme(s);
      applyFavicon(s);
      applyTitle(s);
    } catch {
      /* keep defaults on failure */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Next re-injects its own favicon and can reset CSS vars on client-side
  // navigation — re-apply the tenant's branding whenever the route changes.
  const pathname = usePathname();
  useEffect(() => {
    applyTheme(settings);
    applyFavicon(settings);
  }, [pathname, settings]);

  const get = useCallback((group: string, key: string) => settings[group]?.[key] ?? "", [settings]);

  const value = useMemo(
    () => ({ settings, currencies, loading, get, refresh }),
    [settings, currencies, loading, get, refresh],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
