export const APP_USER_ENDPOINTS = {
  list: "/user/list",
} as const;

/** Nav slug → role name (as stored in the `roles` table). */
export const ROLE_BY_SLUG: Record<string, string> = {
  owners: "Owner",
  "multi-branch-managers": "Multi Branch Manager",
  "branch-managers": "Branch Manager",
  chefs: "Chef",
  waiters: "Waiter",
  "delivery-riders": "Delivery Rider",
  customers: "Customer",
};
