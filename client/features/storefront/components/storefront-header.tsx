"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, User } from "lucide-react";
import { NearestBranch } from "@/features/storefront/components/nearest-branch";
import { TenantLogo } from "@/components/brand/tenant-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/account", label: "Account", auth: true },
];

export function StorefrontHeader() {
  const pathname = usePathname();
  const itemCount = useCart((s) => s.itemCount());
  const isAuthenticated = useCustomerSession((s) => s.isAuthenticated);
  const hydrated = useHydrated();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <TenantLogo href="/" showTagline />
          {/* Landing has its own branch context bar — avoid showing it twice. */}
          {pathname !== "/" && <NearestBranch variant="inline" className="hidden md:flex" />}
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/account">
                <User className="size-4" />
                Account
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
          )}

          <Button asChild variant="outline" size="sm" className="relative">
            <Link href="/checkout" aria-label="View cart">
              <ShoppingBag className="size-4" />
              <span className="hidden sm:inline">Cart</span>
              {hydrated && itemCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100%,20rem)]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-6 pb-6">
                <Link href="/order" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                  Order online
                </Link>
                {isAuthenticated ? (
                  <Link href="/account" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                    My account
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                      Sign in
                    </Link>
                    <Link href="/signup" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                      Create account
                    </Link>
                  </>
                )}
                <Link href="/checkout" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                  Cart ({itemCount})
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile: full-width nearest-branch bar under the main row.
          Hidden on the landing, which shows its own branch context bar. */}
      {pathname !== "/" && <NearestBranch variant="bar" className="md:hidden" />}
    </header>
  );
}
