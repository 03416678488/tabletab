"use client";

import { useCallback } from "react";

import { useSettings } from "@/features/app-settings/components/settings-provider";
import { settingsService } from "@/features/app-settings/services/settings.service";

/**
 * The order-wide default tax, stored as `site.default_tax`:
 *   ""          → none
 *   "t:<id>"    → a single VAT
 *   "g:<id>"    → a VAT group
 * The POS auto-applies it (overridable per order).
 */
export function useDefaultTax() {
  const { get, refresh } = useSettings();
  const defaultTax = get("site", "default_tax") || "";

  const setDefault = useCallback(
    async (value: string) => {
      await settingsService.saveGroup("site", { default_tax: value });
      await refresh();
    },
    [refresh],
  );

  return { defaultTax, setDefault };
}
