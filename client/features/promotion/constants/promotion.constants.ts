export const PROMOTION_ENDPOINTS = {
  base: "/promotions",
  byId: (id: string) => `/promotions/${id}`,
  active: "/promotions/active",
  bySlug: (slug: string) => `/promotions/slug/${slug}`,
  validate: "/promotions/validate",
} as const;
