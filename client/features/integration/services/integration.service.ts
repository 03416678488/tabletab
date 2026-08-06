import { httpClient } from "@/lib/httpClient";
import type { CatalogItem } from "@/features/integration/types/integration.types";

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
};
