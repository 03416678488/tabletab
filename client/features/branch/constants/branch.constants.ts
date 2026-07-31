export const BRANCH_ENDPOINTS = {
  base: "/branches",
  byId: (id: string) => `/branches/${id}`,
} as const;

export const BRANCH_DEFAULT_CITY = "Portland";
