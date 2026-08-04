export const AREA_ENDPOINTS = {
  base: "/areas",
  byId: (id: string) => `/areas/${id}`,
} as const;
