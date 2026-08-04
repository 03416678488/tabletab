export const FOOD_TYPE_ENDPOINTS = {
  base: "/food-types",
  byId: (id: string) => `/food-types/${id}`,
} as const;
