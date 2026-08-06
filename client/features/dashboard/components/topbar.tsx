"use client";

import Link from "next/link";
import { Menu, PanelLeft, PanelLeftClose, ReceiptText, Table2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "@/features/dashboard/components/sidebar-nav";
import { BranchSwitcher } from "@/features/branch/components/branch-switcher";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { ProfileMenu } from "@/features/dashboard/components/profile-menu";
import { hrefFor, roleHomePath } from "@/lib/nav";
import { useSession } from "@/hooks/use-session";

interface TopbarProps {
  collapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function Topbar({ collapsed, onToggleSidebar }: TopbarProps) {
  const user = useSession((s) => s.user!);

  // Only roles that span multiple branches switch branches. Single-branch roles
  // (branch manager, waiter, chef, delivery) don't see the switcher.
  const canSwitchBranch =
    user.role === "owner" || user.role === "multi_branch_manager";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur lg:px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-border">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Logo href={roleHomePath(user.role)} />
          </SheetHeader>
          <SidebarNav />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar toggle */}
      <button
        type="button"
        aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
        title={collapsed ? "Show sidebar" : "Hide sidebar"}
        onClick={onToggleSidebar}
        className={cn(
          ICON_BTN,
          "hidden bg-brand-tint text-brand-deep hover:bg-brand-tint/70 lg:inline-flex",
        )}
      >
        {collapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
      </button>

      {canSwitchBranch && <BranchSwitcher />}

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />

        <ProfileMenu />
      </div>
    </header>
  );
}

const ICON_BTN =
  "inline-flex size-9 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";