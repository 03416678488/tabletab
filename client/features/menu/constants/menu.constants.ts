export const MENU_ENDPOINTS = {
  base: "/menu-items",
  byId: (id: string) => `/menu-items/${id}`,
} as const;
