"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search, User } from "lucide-react";
import { CartMenu } from "@/features/storefront/components/cart-menu";
import { SearchDialog } from "@/features/storefront/components/search-dialog";
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
import { useSiteHeaderConfig } from "@/features/website-builder/render/site-chrome";

export function StorefrontHeader() {
  const itemCount = useCart((s) => s.itemCount());
  const isAuthenticated = useCustomerSession((s) => s.isAuthenticated);
  const hydrated = useHydrated();
  const [searchOpen, setSearchOpen] = useState(false);

  // Header customisation from the website builder (nav links, toggles).
  const headerCfg = useSiteHeaderConfig();
  const navLinks = headerCfg?.links ?? [];
  const showSearch = headerCfg?.showSearch ?? true;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <TenantLogo href="/" showTagline nameOverride={headerCfg?.brandName} />
          {navLinks.length > 0 && (
            <nav className="ml-1 hidden items-center gap-5 lg:flex">
              {navLinks.map((l, i) => (
                <Link
                  key={i}
                  href={l.href || "#"}
                  className="whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-ink"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {showSearch && (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search the menu"
              className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-brand/40 hover:text-ink"
            >
              <Search className="size-4" />
            </button>
          )}
          {isAuthenticated ? (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/account">
                <User className="size-4" />
                Account
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/signin">Sign in</Link>
            </Button>
          )}

          <CartMenu />

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
                {navLinks.map((l, i) => (
                  <Link
                    key={i}
                    href={l.href || "#"}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                  >
                    {l.label}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <Link href="/account" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                    My account
                  </Link>
                ) : (
                  <>
                    <Link href="/signin" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                      Sign in
                    </Link>
                    <Link href="/signup" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                      Create account
                    </Link>
                  </>
                )}
                <Link href="/checkout" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                  Cart ({hydrated ? itemCount : 0})
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
