export const EVENT_ENDPOINTS = {
  base: "/events",
  byId: (id: string) => `/events/${id}`,
} as const;

export const EVENT_TYPE_ENDPOINTS = {
  base: "/event-types",
  byId: (id: string) => `/event-types/${id}`,
} as const;

export const EVENT_STATUSES = ["requested", "confirmed", "completed", "cancelled"] as const;
