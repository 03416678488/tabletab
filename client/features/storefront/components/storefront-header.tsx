"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
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
import { useSiteHeaderConfig } from "@/features/website-builder/render/site-chrome";

export function StorefrontHeader() {
  const pathname = usePathname();
  const itemCount = useCart((s) => s.itemCount());
  const isAuthenticated = useCustomerSession((s) => s.isAuthenticated);
  const hydrated = useHydrated();

  // Header customisation from the website builder (nav links, CTA, toggles).
  const headerCfg = useSiteHeaderConfig();
  const navLinks = headerCfg?.links ?? [];
  const showLocation = headerCfg?.showLocation ?? true;
  const showSearch = headerCfg?.showSearch ?? true;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <TenantLogo href="/" showTagline nameOverride={headerCfg?.brandName} />
          {/* Landing has its own branch context bar — avoid showing it twice. */}
          {showLocation && pathname !== "/" && (
            <NearestBranch variant="inline" className="hidden md:flex" />
          )}
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

        {showSearch && <HeaderSearch />}

        <div className="flex items-center gap-2">
          {showSearch && (
            <Link
              href="/order"
              aria-label="Search the menu"
              className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-brand/40 hover:text-ink md:hidden"
            >
              <Search className="size-4" />
            </Link>
          )}
          {headerCfg?.ctaLabel && (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href={headerCfg.ctaHref || "/order"}>{headerCfg.ctaLabel}</Link>
            </Button>
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
      {showLocation && pathname !== "/" && <NearestBranch variant="bar" className="md:hidden" />}
    </header>
  );
}

/** Desktop menu search — submits to /order, which reads the `q` query param. */
function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/order?q=${encodeURIComponent(term)}` : "/order");
  };

  return (
    <form onSubmit={submit} className="relative hidden max-w-xs flex-1 md:block">
      <button
        type="submit"
        aria-label="Search"
        className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-brand"
      >
        <Search className="size-4" />
      </button>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search dishes…"
        aria-label="Search the menu"
        className="h-9 w-full rounded-full border border-border bg-surface pl-9 pr-3 text-sm text-ink outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-brand/40"
      />
    </form>
  );
}
