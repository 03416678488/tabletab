import {
  Armchair,
  ArrowDownCircle,
  Bell,
  Bike,
  CalendarCheck,
  ArrowLeftRight,
  ArrowUpCircle,
  BarChart3,
  Boxes,
  ChefHat,
  ConciergeBell,
  Globe,
  LayoutDashboard,
  type LucideIcon,
  MapPin,
  MessageCircle,
  MonitorCheck,
  MonitorPlay,
  PartyPopper,
  Percent,
  Plug,
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
import {
  ALL_ROLES as ALL,
  MANAGER_ROLES as MANAGERS,
  OWNER_ROLES as OWNER_ONLY,
} from "@/lib/permissions";

export type NavSection = "Operations" | "POS & Orders" | "Finance" | "Management" | "Users";

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
  /**
   * Show an unread-count badge from the notification feed: a category slug
   * (e.g. "delivery", "orders", "reservations") or "all" for the total unread.
   */
  badgeCategory?: string;
  /** When present, this item is a collapsible dropdown (no direct route). */
  children?: NavChild[];
}

// Role groups (ALL / MANAGERS / OWNER_ONLY) come from the authorization matrix
// in lib/permissions.ts so the nav a user sees matches the pages they can reach.

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    slug: "dashboard",
    icon: LayoutDashboard,
    roles: ALL,
    section: "Operations",
    module: "dashboard",
  },
  {
    label: "Notifications",
    slug: "notifications",
    icon: Bell,
    roles: ALL,
    section: "Operations",
    badgeCategory: "all",
  },
  {
    label: "Deliveries",
    slug: "deliveries",
    icon: Bike,
    roles: [...MANAGERS, "delivery"],
    section: "Operations",
    module: "orders",
    badgeCategory: "delivery",
  },
  {
    label: "Waiter",
    slug: "waiter",
    icon: ConciergeBell,
    roles: [...MANAGERS, "waiter"],
    section: "Operations",
  },
  { label: "Manager", slug: "manager", icon: ShieldCheck, roles: MANAGERS, section: "Operations" },
  {
    label: "Reservations",
    slug: "reservations",
    icon: CalendarCheck,
    roles: [...MANAGERS, "waiter"],
    section: "Operations",
    badgeCategory: "reservations",
  },
  {
    label: "Table",
    slug: "tables",
    icon: Armchair,
    roles: [...MANAGERS, "waiter"],
    section: "Operations",
    module: "tables",
  },
  {
    label: "Inventory",
    slug: "inventory",
    icon: Boxes,
    roles: MANAGERS,
    section: "Operations",
    badgeCategory: "inventory",
  },

  {
    label: "POS",
    slug: "pos",
    icon: ScanLine,
    roles: [...MANAGERS, "waiter"],
    section: "POS & Orders",
    module: "pos",
  },
  {
    label: "POS Orders",
    slug: "pos-orders",
    icon: ReceiptText,
    roles: [...MANAGERS, "waiter"],
    section: "POS & Orders",
    module: "orders",
  },
  {
    label: "Online Orders",
    slug: "online-orders",
    icon: ShoppingBag,
    roles: MANAGERS,
    section: "POS & Orders",
    module: "orders",
    badgeCategory: "orders",
  },
  {
    label: "Table Orders",
    slug: "table-orders",
    icon: ConciergeBell,
    roles: [...MANAGERS, "waiter"],
    section: "POS & Orders",
    module: "orders",
  },
  {
    label: "K.D.S",
    slug: "kds",
    icon: MonitorPlay,
    roles: [...MANAGERS, "chef"],
    section: "POS & Orders",
    module: "kds",
  },
  {
    label: "O.S.S",
    slug: "oss",
    icon: MonitorCheck,
    roles: MANAGERS,
    section: "POS & Orders",
    module: "oss",
  },

  {
    label: "Reports",
    slug: "reports",
    icon: BarChart3,
    roles: MANAGERS,
    section: "Finance",
    module: "reports",
  },
  {
    label: "Transactions",
    slug: "transactions",
    icon: ArrowLeftRight,
    roles: MANAGERS,
    section: "Finance",
    module: "reports",
  },
  {
    label: "Cash Register",
    slug: "cash-register",
    icon: Wallet,
    roles: MANAGERS,
    section: "Finance",
    module: "reports",
  },
  {
    label: "Income",
    icon: ArrowDownCircle,
    roles: MANAGERS,
    section: "Finance",
    children: [
      { label: "Income List", slug: "income", roles: MANAGERS },
      { label: "Income Categories", slug: "income-categories", roles: MANAGERS },
    ],
  },
  {
    label: "Expense",
    icon: ArrowUpCircle,
    roles: MANAGERS,
    section: "Finance",
    children: [
      { label: "Expense List", slug: "expense", roles: MANAGERS },
      { label: "Expense Categories", slug: "expense-categories", roles: MANAGERS },
    ],
  },

  {
    label: "Menu",
    icon: UtensilsCrossed,
    roles: MANAGERS,
    section: "Management",
    children: [
      { label: "Menu", slug: "menus", roles: MANAGERS, module: "menu" },
      { label: "Item", slug: "menu", roles: MANAGERS, module: "menu" },
      { label: "Import / Export", slug: "menu-io", roles: MANAGERS, module: "menu" },
      { label: "Category", slug: "categories", roles: MANAGERS, module: "categories" },
      { label: "Food Types", slug: "food-types", roles: MANAGERS, module: "menu" },
      { label: "Reviews", slug: "reviews", roles: MANAGERS, module: "menu" },
    ],
  },
  {
    label: "Tables",
    icon: Table2,
    roles: MANAGERS,
    section: "Management",
    children: [
      { label: "Areas", slug: "areas", roles: MANAGERS, module: "areas" },
      { label: "Tables", slug: "tables-list", roles: MANAGERS, module: "tables" },
      { label: "QR Codes", slug: "qr-codes", roles: MANAGERS, module: "qr-codes" },
    ],
  },
  {
    label: "VAT",
    icon: Percent,
    roles: MANAGERS,
    section: "Management",
    children: [
      { label: "VAT Listing", slug: "vat", roles: MANAGERS },
      { label: "VAT Group", slug: "vat-groups", roles: MANAGERS },
    ],
  },
  {
    label: "Branches",
    slug: "branches",
    icon: MapPin,
    roles: MANAGERS,
    section: "Management",
    module: "branches",
  },
  {
    label: "Events",
    icon: PartyPopper,
    roles: MANAGERS,
    section: "Management",
    children: [
      { label: "Bookings", slug: "events", roles: MANAGERS },
      { label: "Event Types", slug: "event-types", roles: MANAGERS },
    ],
  },
  {
    label: "Marketplace",
    slug: "marketplace",
    icon: Plug,
    roles: OWNER_ONLY,
    section: "Management",
    module: "settings",
  },
  {
    label: "Settings",
    slug: "settings",
    icon: Settings,
    roles: OWNER_ONLY,
    section: "Management",
    module: "settings",
  },
  {
    label: "Website Setting",
    slug: "website-settings",
    icon: Globe,
    roles: OWNER_ONLY,
    section: "Management",
    module: "settings",
  },
  {
    label: "Promotions",
    slug: "promotions",
    icon: Percent,
    roles: MANAGERS,
    section: "Management",
    module: "settings",
  },
  {
    label: "Campaigns",
    slug: "campaigns",
    icon: MessageCircle,
    roles: MANAGERS,
    section: "Management",
    module: "settings",
  },

  // USERS — one listing per fixed role.
  {
    label: "Owners",
    slug: "owners",
    icon: ShieldCheck,
    roles: OWNER_ONLY,
    section: "Users",
    module: "users",
  },
  {
    label: "Multi Branch Managers",
    slug: "multi-branch-managers",
    icon: MapPin,
    roles: OWNER_ONLY,
    section: "Users",
    module: "users",
  },
  {
    label: "Branch Managers",
    slug: "branch-managers",
    icon: ShieldCheck,
    roles: OWNER_ONLY,
    section: "Users",
    module: "users",
  },
  {
    label: "Chefs",
    slug: "chefs",
    icon: ChefHat,
    roles: OWNER_ONLY,
    section: "Users",
    module: "users",
  },
  {
    label: "Waiters",
    slug: "waiters",
    icon: ConciergeBell,
    roles: OWNER_ONLY,
    section: "Users",
    module: "users",
  },
  {
    label: "Delivery Riders",
    slug: "delivery-riders",
    icon: Bike,
    roles: OWNER_ONLY,
    section: "Users",
    module: "users",
  },
  {
    label: "Customers",
    slug: "customers",
    icon: UsersRound,
    roles: OWNER_ONLY,
    section: "Users",
    module: "users",
  },
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
  owner: "Owner",
  multi_branch_manager: "Multi Branch Manager",
  branch_manager: "Branch Manager",
  chef: "Chef",
  waiter: "Waiter",
  delivery: "Delivery Rider",
};

/** Default landing route after login for each role: /{role}/dashboard. */
export function roleHomePath(role: StaffRole): string {
  return `/${role}/dashboard`;
}
