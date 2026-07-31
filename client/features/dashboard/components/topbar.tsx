"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "@/features/dashboard/components/sidebar-nav";
import { BranchSwitcher } from "@/features/branch/components/branch-switcher";
import { ROLE_LABELS } from "@/lib/nav";
import { useSession } from "@/hooks/use-session";

export function Topbar() {
  const router = useRouter();
  const user = useSession((s) => s.user!);
  const logout = useSession((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-border">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Logo href="/dashboard" />
          </SheetHeader>
          <SidebarNav />
        </SheetContent>
      </Sheet>

      <BranchSwitcher />

      <div className="relative ml-auto hidden max-w-xs flex-1 items-center md:flex">
        <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
        <Input placeholder="Search orders, tables…" className="pl-9" aria-label="Search" />
      </div>

      <div className="ml-auto flex items-center gap-2 md:ml-3">
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-accent ring-2 ring-surface" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          onClick={handleLogout}
          className="hidden sm:inline-flex"
        >
          <LogOut className="size-5" />
        </Button>

        <div className="flex items-center gap-2.5 rounded-xl pl-1">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt=""
              width={36}
              height={36}
              className="size-9 rounded-full border border-border object-cover"
              unoptimized
            />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full border border-border bg-brand-tint text-xs font-semibold text-brand-deep">
              {user.name
                .split(" ")
                .map((p) => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
          )}
          <div className="hidden flex-col leading-tight lg:flex">
            <span className="text-sm font-semibold text-ink">{user.name}</span>
            <span className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
