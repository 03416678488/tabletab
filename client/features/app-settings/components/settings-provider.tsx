"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { setCurrencyConfig } from "@/lib/currency";
import { settingsService } from "@/features/app-settings/services/settings.service";
import type {
  CurrencyRow,
  SettingsGroups,
} from "@/features/app-settings/types/settings.types";

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

/** Applies the configured brand color to the runtime theme CSS variables. */
function applyTheme(settings: SettingsGroups) {
  const color = settings.theme?.primary_color;
  if (!color || typeof document === "undefined") return;
  const root = document.documentElement.style;
  root.setProperty("--brand", color);
  root.setProperty("--brand-hover", color);
  root.setProperty("--brand-deep", `color-mix(in srgb, ${color} 82%, black)`);
  root.setProperty("--brand-tint", `color-mix(in srgb, ${color} 12%, white)`);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsGroups>({});
  const [currencies, setCurrencies] = useState<CurrencyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([
        settingsService.getPublic(),
        settingsService.currencies(),
      ]);
      setSettings(s);
      setCurrencies(c);
      applyCurrency(s, c);
      applyTheme(s);
    } catch {
      /* keep defaults on failure */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const get = useCallback(
    (group: string, key: string) => settings[group]?.[key] ?? "",
    [settings],
  );

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
