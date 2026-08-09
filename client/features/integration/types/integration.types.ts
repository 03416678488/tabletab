export type IntegrationCategory = "delivery" | "messaging" | "accounting" | "marketing";

export type IntegrationStatus = "available" | "coming_soon";
export type IntegrationAuthType = "api_key" | "oauth" | "builtin";

export interface IntegrationField {
  key: string;
  label: string;
  type?: "text" | "password";
  placeholder?: string;
}

export interface CatalogItem {
  key: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  status: IntegrationStatus;
  authType: IntegrationAuthType;
  fields?: IntegrationField[];
  manageSlug?: string;
  webhookPath?: string;
  canPushMenu?: boolean;
  connected: boolean;
  connectedAt: string | null;
  lastSyncAt: string | null;
  /** Per-tenant webhook token (present once connected). */
  webhookToken: string | null;
}

export interface SyncLog {
  id: string;
  provider: string;
  direction: "order_in" | "menu_out" | "status_out";
  status: "success" | "error";
  message: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}
