export const APP_USER_ENDPOINTS = {
  list: "/user/list",
} as const;

/** Nav slug → role name (as stored in the `roles` table). */
export const ROLE_BY_SLUG: Record<string, string> = {
  administrators: "Administrators",
  "delivery-boys": "Delivery Boys",
  customers: "Customers",
  employees: "Employees",
  waiters: "Waiters",
  chefs: "Chefs",
};
