import { httpClient } from "@/lib/httpClient";
import type {
  Currency,
  CurrencyInput,
  FxSettings,
  FxSettingsInput,
  SyncResult,
} from "@/features/currency/types/currency.types";

export const currencyService = {
  list() {
    return httpClient.get<Currency[]>("/currencies").then((r) => r.data);
  },
  /** Pull latest FX rates from the configured provider (with fallback). */
  sync() {
    return httpClient.post<SyncResult>("/currencies/sync", {}, { auth: true }).then((r) => r.data);
  },
  fxSettings() {
    return httpClient
      .get<FxSettings>("/currencies/fx-settings", { auth: true })
      .then((r) => r.data);
  },
  saveFxSettings(body: FxSettingsInput) {
    return httpClient
      .put<FxSettings>("/currencies/fx-settings", body, { auth: true })
      .then((r) => r.data);
  },
  create(body: CurrencyInput) {
    return httpClient.post<Currency>("/currencies", body, { auth: true }).then((r) => r.data);
  },
  update(id: number, body: Partial<CurrencyInput>) {
    return httpClient.put<Currency>(`/currencies/${id}`, body, { auth: true }).then((r) => r.data);
  },
  remove(id: number) {
    return httpClient
      .delete<{ message: string }>(`/currencies/${id}`, { auth: true })
      .then((r) => r.data);
  },
};
