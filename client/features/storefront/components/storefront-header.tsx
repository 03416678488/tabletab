"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Search, User } from "lucide-react";
import { CartMenu } from "@/features/storefront/components/cart-menu";
import { LanguageMenu } from "@/features/storefront/components/language-menu";
import { LocationPermissionDialog } from "@/features/storefront/components/location-permission-dialog";
import { PreferencesMenu } from "@/features/storefront/components/preferences-menu";
import { SearchDialog } from "@/features/storefront/components/search-dialog";
import { TenantLogo } from "@/components/brand/tenant-logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useBranchPicker } from "@/hooks/use-branch-picker";
import { useCart } from "@/hooks/use-cart";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSiteHeaderConfig } from "@/features/website-builder/render/site-chrome";

export function StorefrontHeader() {
  const itemCount = useCart((s) => s.itemCount());
  const isAuthenticated = useCustomerSession((s) => s.isAuthenticated);
  const hydrated = useHydrated();
  const [searchOpen, setSearchOpen] = useState(false);

  // Publish the real (two-tier, responsive) header height so the sticky sub-bars
  // below (fulfillment tabs, category nav) stack against it instead of a hardcoded
  // 4rem — the utility strip only exists on desktop, so the height differs by bp.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const publish = () =>
      document.documentElement.style.setProperty("--sf-header-h", `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Branch/location picker dialog — mounted once here (global to the storefront)
  // and opened from the landing's location pill via the shared store.
  const pickerOpen = useBranchPicker((s) => s.open);
  const setPickerOpen = useBranchPicker((s) => s.setOpen);

  // Header customisation from the website builder (nav links, toggles).
  const headerCfg = useSiteHeaderConfig();
  // "Menu" (→ "/", redundant with the logo) and "Events" (now an Order-mode tab
  // in the landing) are dropped from the top nav.
  const navLinks = (headerCfg?.links ?? []).filter((l) => {
    const href = l.href || "";
    return href !== "/" && !/^\/events(\/|$|\?)/.test(href);
  });
  const showSearch = headerCfg?.showSearch ?? true;

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-border bg-surface md:bg-surface/90 md:backdrop-blur-md"
    >
      {/* Tier 1 — utility strip (desktop): location + low-frequency prefs/account.
          Keeps the main bar clean and gives new options (language, etc.) a home. */}
      <div className="hidden border-b border-border/60 bg-subtle/50 md:block">
        <div className="mx-auto flex h-7 max-w-6xl items-center gap-4 px-4 text-xs sm:px-6">
          <div className="ml-auto flex items-center gap-3">
            <LanguageMenu bare />
            <PreferencesMenu bare />
            <span className="h-3.5 w-px bg-border" aria-hidden />
            <Link
              href={isAuthenticated ? "/account" : "/signin"}
              className="flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-ink"
            >
              <User className="size-3.5" />
              {isAuthenticated ? "Account" : "Sign in"}
            </Link>
          </div>
        </div>
      </div>

      {/* Tier 2 — main bar: brand + nav | search + cart. */}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
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

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {showSearch && (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search the menu"
              className="flex h-9 items-center gap-2 rounded-full border border-border pl-3 pr-4 text-sm text-muted-foreground transition-colors hover:border-brand/40 hover:text-ink"
            >
              <Search className="size-4" />
              <span className="hidden whitespace-nowrap sm:inline">Search the menu</span>
            </button>
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
                <Link
                  href="/favorites"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                >
                  My favorites
                </Link>
                {isAuthenticated ? (
                  <Link
                    href="/account"
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                  >
                    My account
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signin"
                      className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                    >
                      Create account
                    </Link>
                  </>
                )}
                <Link
                  href="/checkout"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                >
                  Cart ({hydrated ? itemCount : 0})
                </Link>
                <div className="mt-2 flex items-center justify-between rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-muted-foreground">Language</span>
                  <LanguageMenu />
                </div>
                <div className="flex items-center justify-between rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-muted-foreground">Currency</span>
                  <PreferencesMenu />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <LocationPermissionDialog open={pickerOpen} onOpenChange={setPickerOpen} />
    </header>
  );
}
