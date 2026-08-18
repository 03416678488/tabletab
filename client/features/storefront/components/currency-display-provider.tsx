"use client";

import { useEffect } from "react";

import { useSettings } from "@/features/app-settings/components/settings-provider";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { setCurrencyConfig } from "@/lib/currency";

/**
 * Storefront-only: applies the visitor's chosen display currency (symbol + rate)
 * to the global money formatter, converting from the base (pricing) currency.
 * No choice → the tenant's Default currency (as set app-wide by SettingsProvider).
 * Display-only — orders are still priced/charged in the base currency.
 *
 * The subtree is keyed on the effective currency so prices recompute on switch.
 * On unmount (leaving the storefront) it resets to the Default so the admin —
 * which shares the same global formatter — isn't left on the visitor's choice.
 */
export function CurrencyDisplayProvider({ children }: { children: React.ReactNode }) {
  const { currencies, get } = useSettings();
  const code = useDisplayCurrency((s) => s.code);

  const baseCode = (
    get("site", "base_currency") ||
    get("site", "default_currency") ||
    "USD"
  ).toUpperCase();
  const defaultCode = (get("site", "default_currency") || "USD").toUpperCase();
  const find = (c: string) => currencies.find((x) => x.code.toUpperCase() === c);

  const base = find(baseCode);
  const chosen = code
    ? currencies.find((x) => x.code.toUpperCase() === code.toUpperCase() && x.isActive)
    : null;
  const display = chosen ?? find(defaultCode);

  const baseRate = base?.exchangeRate || 1;
  const rate = display ? (display.exchangeRate || 1) / baseRate : 1;
  // Set during render so children below read the right config on the same pass.
  if (display) setCurrencyConfig({ symbol: display.symbol, rate });

  const effective = (display?.code ?? defaultCode).toUpperCase();

  // Reset to the Default currency when the storefront unmounts (e.g. into admin).
  useEffect(() => {
    return () => {
      const def = find(defaultCode);
      const b = find(baseCode);
      if (def) {
        setCurrencyConfig({
          symbol: def.symbol,
          rate: (def.exchangeRate || 1) / (b?.exchangeRate || 1),
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCode, baseCode, currencies]);

  return (
    <div key={effective} className="contents">
      {children}
    </div>
  );
}
