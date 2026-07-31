import { DEFAULT_BRANDING } from "@/lib/theme";

export const TENANT = {
  id: "tnt-olive-ash",
  name: "Olive & Ash",
  tagline: "Modern Mediterranean kitchen",
  branding: DEFAULT_BRANDING,
} as const;

export { branches } from "./branches";
export { branchOnlineConfig, getBranchOnlineConfig } from "./branch-online";
export type { BranchOnlineConfig } from "./branch-online";
export { categories, menuItems } from "./menu";
export { staffUsers, customerAccount } from "./staff";
export { orders, serviceRequests, salesLast7Days } from "./orders";
export { getOwnerAnalytics } from "./analytics";
