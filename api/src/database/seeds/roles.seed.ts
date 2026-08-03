/**
 * Super Admin + Admin stay for the existing owner logins; the rest are the
 * fixed, business-facing roles managed from the Roles & Permissions screen.
 * `User` is the default role assigned to self-registered accounts.
 */
export const ROLES_SEED = [
  { name: 'Super Admin' },
  { name: 'Admin' },
  { name: 'Administrators' },
  { name: 'Delivery Boys' },
  { name: 'Customers' },
  { name: 'Employees' },
  { name: 'Waiters' },
  { name: 'Chefs' },
  { name: 'User' },
];
