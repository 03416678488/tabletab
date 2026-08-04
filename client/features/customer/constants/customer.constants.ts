export const CUSTOMER_ENDPOINTS = {
  base: "/customers",
  byId: (id: string) => `/customers/${id}`,
} as const;
