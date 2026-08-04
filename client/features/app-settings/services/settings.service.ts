import { httpClient } from "@/lib/httpClient";
import type {
  CurrencyRow,
  SettingsGroups,
} from "@/features/app-settings/types/settings.types";

export const settingsService = {
  /** Public display settings (company, site, social, theme). */
  getPublic() {
    return httpClient
      .get<SettingsGroups>("/settings")
      .then((res) => res.data);
  },

  /** All setting groups (admin screens). */
  getAll() {
    return httpClient
      .get<SettingsGroups>("/settings/all", { auth: true })
      .then((res) => res.data);
  },

  saveGroup(group: string, values: Record<string, string>) {
    return httpClient
      .put<Record<string, string>>(`/settings/${group}`, { values }, { auth: true })
      .then((res) => res.data);
  },

  currencies() {
    return httpClient
      .get<CurrencyRow[]>("/currencies")
      .then((res) => res.data);
  },
};
