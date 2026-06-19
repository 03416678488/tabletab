import {
  ChefHat,
  ConciergeBell,
  LayoutDashboard,
  type LucideIcon,
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

const ALL: StaffRole[] = ["owner", "manager", "chef", "waiter"];

export const navItems: NavItem[] = [
  { label: "Overview", href: "/app", icon: LayoutDashboard, roles: ALL, section: "Operations" },
  { label: "Kitchen", href: "/app/kitchen", icon: ChefHat, roles: ["owner", "manager", "chef"], section: "Operations" },
  { label: "Waiter", href: "/app/waiter", icon: ConciergeBell, roles: ["owner", "manager", "waiter"], section: "Operations" },
  { label: "Manager", href: "/app/manager", icon: ShieldCheck, roles: ["owner", "manager"], section: "Operations" },
  { label: "Reports", href: "/app/owner", icon: LayoutDashboard, roles: ["owner"], section: "Management" },
  { label: "Menu", href: "/app/menu", icon: UtensilsCrossed, roles: ["owner", "manager"], section: "Management" },
  { label: "Staff", href: "/app/staff", icon: UsersRound, roles: ["owner"], section: "Management" },
  { label: "Settings", href: "/app/settings", icon: Settings, roles: ["owner"], section: "Management" },
];

export function navItemsForRole(role: StaffRole): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Owner",
  manager: "Manager",
  chef: "Chef",
  waiter: "Waiter",
};

/** Default landing route after staff login for each role. */
export function roleHomePath(role: StaffRole): string {
  switch (role) {
    case "chef":
      return "/app/kitchen";
    case "waiter":
      return "/app/waiter";
    case "manager":
      return "/app/manager";
    case "owner":
      return "/app/owner";
    default:
      return "/app";
  }
}
