import {
  Armchair,
  ArrowDownCircle,
  Bike,
  ArrowLeftRight,
  ArrowUpCircle,
  BarChart3,
  ChefHat,
  ConciergeBell,
  Globe,
  LayoutDashboard,
  type LucideIcon,
  MapPin,
  MessageCircle,
  MonitorCheck,
  MonitorPlay,
  Percent,
  ReceiptText,
  ScanLine,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Table2,
  UsersRound,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import type { StaffRole } from "@/lib/types";

export type NavSection =
  | "Operations"
  | "POS & Orders"
  | "Finance"
  | "Management"
  | "Users";

export const NAV_SECTIONS: NavSection[] = [
  "Operations",
  "POS & Orders",
  "Finance",
  "Management",
  "Users",
];

/** A child link inside a dropdown nav item. */
export interface NavChild {
  label: string;
  slug: string;
  roles: StaffRole[];
  /** Permission module key — hidden unless the user can view it. */
  module?: string;
}

export interface NavItem {
  label: string;
  /** Feature path segment for leaf items. Final href is `/{role}/{slug}`. */
  slug?: string;
  icon: LucideIcon;
  /** Roles allowed to see this item. */
  roles: StaffRole[];
  section: NavSection;
  /** Permission module key — hidden unless the user can view it. */
  module?: string;
  /** When present, this item is a collapsible dropdown (no direct route). */
  children?: NavChild[];
}

const ALL: StaffRole[] = ["admin", "manager", "chef", "waiter", "delivery"];
const ADMIN_MANAGER: StaffRole[] = ["admin", "manager"];

export const navItems: NavItem[] = [
  { label: "Dashboard", slug: "dashboard", icon: LayoutDashboard, roles: ALL, section: "Operations", module: "dashboard" },
  { label: "Deliveries", slug: "deliveries", icon: Bike, roles: ["admin", "manager", "delivery"], section: "Operations", module: "orders" },
  { label: "Kitchen", slug: "kitchen", icon: ChefHat, roles: ["admin", "manager", "chef"], section: "Operations", module: "kds" },
  { label: "Waiter", slug: "waiter", icon: ConciergeBell, roles: ["admin", "manager", "waiter"], section: "Operations" },
  { label: "Manager", slug: "manager", icon: ShieldCheck, roles: ["admin", "manager"], section: "Operations" },
  { label: "Table", slug: "tables", icon: Armchair, roles: ["admin", "manager", "waiter"], section: "Operations", module: "tables" },

  { label: "POS", slug: "pos", icon: ScanLine, roles: ["admin", "manager", "waiter"], section: "POS & Orders", module: "pos" },
  { label: "POS Orders", slug: "pos-orders", icon: ReceiptText, roles: ["admin", "manager", "waiter"], section: "POS & Orders", module: "orders" },
  { label: "Online Orders", slug: "online-orders", icon: ShoppingBag, roles: ["admin", "manager"], section: "POS & Orders", module: "orders" },
  { label: "Table Orders", slug: "table-orders", icon: ConciergeBell, roles: ["admin", "manager", "waiter"], section: "POS & Orders", module: "orders" },
  { label: "K.D.S", slug: "kds", icon: MonitorPlay, roles: ["admin", "manager", "chef"], section: "POS & Orders", module: "kds" },
  { label: "O.S.S", slug: "oss", icon: MonitorCheck, roles: ["admin", "manager"], section: "POS & Orders", module: "oss" },

  { label: "Reports", slug: "reports", icon: BarChart3, roles: ["admin", "manager"], section: "Finance", module: "reports" },
  { label: "Transactions", slug: "transactions", icon: ArrowLeftRight, roles: ["admin", "manager"], section: "Finance", module: "reports" },
  { label: "Cash Register", slug: "cash-register", icon: Wallet, roles: ["admin", "manager"], section: "Finance", module: "reports" },
  {
    label: "Income",
    icon: ArrowDownCircle,
    roles: ["admin", "manager"],
    section: "Finance",
    children: [
      { label: "Income List", slug: "income", roles: ["admin", "manager"] },
      { label: "Income Categories", slug: "income-categories", roles: ["admin", "manager"] },
    ],
  },
  {
    label: "Expense",
    icon: ArrowUpCircle,
    roles: ["admin", "manager"],
    section: "Finance",
    children: [
      { label: "Expense List", slug: "expense", roles: ["admin", "manager"] },
      { label: "Expense Categories", slug: "expense-categories", roles: ["admin", "manager"] },
    ],
  },

  {
    label: "Menu",
    icon: UtensilsCrossed,
    roles: ADMIN_MANAGER,
    section: "Management",
    children: [
      { label: "Menu", slug: "menus", roles: ADMIN_MANAGER, module: "menu" },
      { label: "Item", slug: "menu", roles: ADMIN_MANAGER, module: "menu" },
      { label: "Category", slug: "categories", roles: ADMIN_MANAGER, module: "categories" },
      { label: "Food Types", slug: "food-types", roles: ADMIN_MANAGER, module: "menu" },
    ],
  },
  {
    label: "Tables",
    icon: Table2,
    roles: ADMIN_MANAGER,
    section: "Management",
    children: [
      { label: "Areas", slug: "areas", roles: ADMIN_MANAGER, module: "areas" },
      { label: "Tables", slug: "tables-list", roles: ADMIN_MANAGER, module: "tables" },
      { label: "QR Codes", slug: "qr-codes", roles: ADMIN_MANAGER, module: "qr-codes" },
    ],
  },
  {
    label: "VAT",
    icon: Percent,
    roles: ADMIN_MANAGER,
    section: "Management",
    children: [
      { label: "VAT Listing", slug: "vat", roles: ADMIN_MANAGER },
      { label: "VAT Group", slug: "vat-groups", roles: ADMIN_MANAGER },
    ],
  },
  { label: "Branches", slug: "branches", icon: MapPin, roles: ADMIN_MANAGER, section: "Management", module: "branches" },
  { label: "Staff", slug: "staff", icon: UsersRound, roles: ["admin"], section: "Management", module: "users" },
  { label: "Settings", slug: "settings", icon: Settings, roles: ["admin"], section: "Management", module: "settings" },
  { label: "Website Setting", slug: "website-settings", icon: Globe, roles: ["admin"], section: "Management", module: "settings" },
  { label: "Promotions", slug: "promotions", icon: Percent, roles: ADMIN_MANAGER, section: "Management", module: "settings" },
  { label: "Campaigns", slug: "campaigns", icon: MessageCircle, roles: ADMIN_MANAGER, section: "Management", module: "settings" },

  // USERS — one listing per fixed role.
  { label: "Administrators", slug: "administrators", icon: ShieldCheck, roles: ["admin"], section: "Users", module: "users" },
  { label: "Delivery Boys", slug: "delivery-boys", icon: ShoppingBag, roles: ["admin"], section: "Users", module: "users" },
  { label: "Customers", slug: "customers", icon: UsersRound, roles: ["admin"], section: "Users", module: "users" },
  { label: "Employees", slug: "employees", icon: UsersRound, roles: ["admin"], section: "Users", module: "users" },
  { label: "Waiters", slug: "waiters", icon: ConciergeBell, roles: ["admin"], section: "Users", module: "users" },
  { label: "Chefs", slug: "chefs", icon: ChefHat, roles: ["admin"], section: "Users", module: "users" },
];

/** Build the role-prefixed href for a feature slug, e.g. ("admin","branches") → "/admin/branches". */
export function hrefFor(role: StaffRole, slug: string): string {
  return `/${role}/${slug}`;
}

/** Nav items visible to a role, with dropdown children also role-filtered. */
export function navItemsForRole(role: StaffRole): NavItem[] {
  return navItems
    .filter((item) => item.roles.includes(role))
    .map((item) =>
      item.children
        ? { ...item, children: item.children.filter((c) => c.roles.includes(role)) }
        : item,
    )
    .filter((item) => !item.children || item.children.length > 0);
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Admin",
  manager: "Manager",
  chef: "Chef",
  waiter: "Waiter",
  delivery: "Delivery",
};

/** Default landing route after login for each role: /{role}/dashboard. */
export function roleHomePath(role: StaffRole): string {
  return `/${role}/dashboard`;
}
