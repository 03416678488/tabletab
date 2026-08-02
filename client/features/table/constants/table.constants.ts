export const TABLE_ENDPOINTS = {
  base: "/tables",
  byId: (id: string) => `/tables/${id}`,
} as const;
