import {
  ChefHat,
  ConciergeBell,
  LayoutDashboard,
  type LucideIcon,
  MapPin,
  Settings,
  ShieldCheck,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";
import type { StaffRole } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles allowed to see this item. */
  roles: StaffRole[];
  section: "Operations" | "Management";
}

const ALL: StaffRole[] = ["admin", "manager", "chef", "waiter"];

export const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ALL, section: "Operations" },
  { label: "Kitchen", href: "/kitchen", icon: ChefHat, roles: ["admin", "manager", "chef"], section: "Operations" },
  { label: "Waiter", href: "/waiter", icon: ConciergeBell, roles: ["admin", "manager", "waiter"], section: "Operations" },
  { label: "Manager", href: "/manager", icon: ShieldCheck, roles: ["admin", "manager"], section: "Operations" },
  { label: "Reports", href: "/admin", icon: LayoutDashboard, roles: ["admin"], section: "Management" },
  { label: "Menu", href: "/menu", icon: UtensilsCrossed, roles: ["admin", "manager"], section: "Management" },
  { label: "Branches", href: "/branches", icon: MapPin, roles: ["admin", "manager"], section: "Management" },
  { label: "Staff", href: "/staff", icon: UsersRound, roles: ["admin"], section: "Management" },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["admin"], section: "Management" },
];

export function navItemsForRole(role: StaffRole): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Admin",
  manager: "Manager",
  chef: "Chef",
  waiter: "Waiter",
};

/** Default landing route after staff login for each role. */
export function roleHomePath(role: StaffRole): string {
  switch (role) {
    case "chef":
      return "/kitchen";
    case "waiter":
      return "/waiter";
    case "manager":
      return "/manager";
    case "admin":
      return "/admin";
    default:
      return "/dashboard";
  }
}
