"use client";

import { useMemo } from "react";

import { IconSelect } from "@/features/i18n/icon-select";
import { useI18n } from "@/features/i18n/i18n-provider";

const AUTO = "__auto__";

/**
 * Currency switcher — a colorful icon that opens a dropdown on click. "Auto"
 * follows the region's currency; picking one overrides it (FX-converted from
 * the base currency). Options come from Settings → Currency (active only).
 */
export function CurrencyMenu({ align }: { align?: "start" | "end" }) {
  const { currency, currencyIsAuto, setCurrency, currencies } = useI18n();

  const options = useMemo(() => {
    const active = (currencies ?? []).filter((c) => c.isActive !== false);
    return [
      { value: AUTO, label: "Auto", sublabel: currency },
      ...active.map((c) => ({ value: c.code, label: c.code, sublabel: `${c.symbol} ${c.name}` })),
    ];
  }, [currencies, currency]);

  if (options.length <= 2) return null;

  return (
    <IconSelect
      icon="💱"
      ariaLabel="Currency"
      title={`Currency: ${currencyIsAuto ? `Auto (${currency})` : currency}`}
      align={align}
      value={currencyIsAuto ? AUTO : currency}
      options={options}
      onChange={(v) => setCurrency(v === AUTO ? null : v)}
    />
  );
}
