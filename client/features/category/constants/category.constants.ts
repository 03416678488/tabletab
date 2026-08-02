export const CATEGORY_ENDPOINTS = {
  base: "/categories",
  byId: (id: string) => `/categories/${id}`,
} as const;
