import { httpClient } from "@/lib/httpClient";
import type { CatalogItem, SyncLog } from "@/features/integration/types/integration.types";

export const integrationService = {
  list() {
    return httpClient
      .get<CatalogItem[]>("/integrations", { auth: true })
      .then((r) => r.data);
  },

  connect(provider: string, config: Record<string, string>) {
    return httpClient
      .post<{ success: true }>(`/integrations/${provider}/connect`, { config }, { auth: true })
      .then((r) => r.data);
  },

  disconnect(provider: string) {
    return httpClient
      .post<{ success: true }>(`/integrations/${provider}/disconnect`, undefined, { auth: true })
      .then((r) => r.data);
  },

  pushMenu(provider: string) {
    return httpClient
      .post<{ items: number; categories: number; status: "sent" | "prepared" }>(
        `/integrations/${provider}/push-menu`,
        undefined,
        { auth: true },
      )
      .then((r) => r.data);
  },

  logs(provider: string) {
    return httpClient
      .get<SyncLog[]>(`/integrations/${provider}/logs`, { auth: true })
      .then((r) => r.data);
  },

  startOAuth(provider: string) {
    return httpClient
      .get<{ url: string }>(`/integrations/${provider}/oauth/start`, { auth: true })
      .then((r) => r.data);
  },
};
