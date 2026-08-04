export const MENUS_ENDPOINTS = {
  base: "/menus",
  byId: (id: string) => `/menus/${id}`,
} as const;
