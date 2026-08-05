export const CAMPAIGN_ENDPOINTS = {
  base: "/campaigns",
  byId: (id: string) => `/campaigns/${id}`,
  send: (id: string) => `/campaigns/${id}/send`,
  recipients: (id: string) => `/campaigns/${id}/recipients`,
  config: "/campaigns/config",
  templates: "/campaigns/templates",
} as const;
