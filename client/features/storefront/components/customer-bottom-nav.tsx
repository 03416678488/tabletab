"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, User } from "lucide-react";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/favorites",
    label: "Saved",
    icon: Heart,
    match: (p: string) => p.startsWith("/favorites"),
  },
  {
    href: "/account",
    label: "Account",
    icon: User,
    match: (p: string) => p.startsWith("/account") || p.startsWith("/login"),
  },
];

/** Mobile bottom nav — hidden on md+ where header nav is used. */
export function CustomerBottomNav() {
  const pathname = usePathname();
  const isAuthenticated = useCustomerSession((s) => s.isAuthenticated);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur-md pb-safe md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
        {links.map((link) => {
          if (link.href === "/account" && !isAuthenticated) {
            return (
              <Link
                key={link.href}
                href="/signin"
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors",
                  pathname.startsWith("/login") || pathname.startsWith("/signup")
                    ? "text-brand-deep"
                    : "text-muted-foreground",
                )}
              >
                <User className="size-5" />
                Sign in
              </Link>
            );
          }
          const active = link.match(pathname);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors",
                active ? "text-brand-deep" : "text-muted-foreground hover:text-ink",
              )}
            >
              <Icon className={cn("size-5", active && "text-brand")} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
