"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, User } from "lucide-react";
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
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/order", label: "Order" },
  { href: "/account", label: "Account", auth: true },
];

export function StorefrontHeader() {
  const pathname = usePathname();
  const itemCount = useCart((s) => s.itemCount());
  const isAuthenticated = useCustomerSession((s) => s.isAuthenticated);

  const showCart = pathname.startsWith("/order/") || pathname === "/checkout";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <TenantLogo href="/" showTagline />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {navLinks.map((link) => {
            if (link.auth && !isAuthenticated) return null;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(link.href)
                    ? "bg-brand-tint text-brand-deep"
                    : "text-muted-foreground hover:bg-secondary hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {showCart && (
            <Button asChild variant="outline" size="sm" className="relative">
              <Link href="/checkout">
                <ShoppingBag className="size-4" />
                <span className="hidden sm:inline">Cart</span>
                {itemCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-primary-foreground">
                    {itemCount}
                  </span>
                )}
              </Link>
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

          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/order">Order now</Link>
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
                {showCart && (
                  <Link href="/checkout" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                    Checkout ({itemCount})
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
