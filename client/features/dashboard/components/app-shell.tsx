"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { QuickSettingsFab } from "@/features/dashboard/components/quick-settings-fab";
import { SidebarNav } from "@/features/dashboard/components/sidebar-nav";
import { Topbar } from "@/features/dashboard/components/topbar";
import { useSession } from "@/hooks/use-session";
import { roleHomePath } from "@/lib/nav";

const COLLAPSE_KEY = "tabletap.sidebar.collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const role = useSession((s) => s.user?.role);
  const home = role ? roleHomePath(role) : "/";

  // The quick-settings control is a management tool — owner + both managers only.
  const showQuickSettings =
    role === "owner" ||
    role === "multi_branch_manager" ||
    role === "branch_manager";

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  const toggleSidebar = () =>
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });

  return (
    <div className="flex min-h-screen w-full bg-subtle">
      {/* Desktop sidebar (collapsible) */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex",
          collapsed && "lg:hidden",
        )}
      >
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo href={home} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar collapsed={collapsed} onToggleSidebar={toggleSidebar} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      {/* Floating quick-settings control — management roles only. */}
      {showQuickSettings && <QuickSettingsFab />}
    </div>
  );
}
