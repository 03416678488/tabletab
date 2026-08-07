"use client";

import { usePathname } from "next/navigation";
import { useSettings } from "@/features/app-settings/components/settings-provider";
import { MenuSkeleton } from "@/features/order/components/menu-skeleton";
import { CustomerBottomNav } from "@/features/storefront/components/customer-bottom-nav";
import { StorefrontFooter } from "@/features/storefront/components/storefront-footer";
import { StorefrontHeader } from "@/features/storefront/components/storefront-header";
import { StorefrontSkeleton } from "@/features/storefront/components/storefront-skeleton";
import { useFavoritesSync } from "@/features/storefront/hooks/use-favorites-sync";

/**
 * Holds the storefront chrome behind a full-page skeleton until branding/settings
 * resolve — so the header/footer never flash default/placeholder branding.
 */
export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const { loading } = useSettings();
  const pathname = usePathname();
  // Keep favorites in sync with the customer's account across devices.
  useFavoritesSync();

  // Immersive, cart-focused flows own the bottom of the screen (a floating cart
  // bar / inline CTA), so the global tab nav is hidden and the footer dropped.
  const immersive = pathname.startsWith("/order/") || pathname.startsWith("/checkout");

  // On the menu route, show the menu-shaped skeleton (same body the page shows
  // while its data loads) so branding-load → data-load reads as one skeleton.
  if (loading) return immersive && pathname.startsWith("/order/") ? <MenuSkeleton /> : <StorefrontSkeleton />;

  return (
    <>
      <StorefrontHeader />
      <main className={immersive ? "flex-1" : "flex-1 pb-20 md:pb-0"}>{children}</main>
      {!immersive && (
        <>
          <StorefrontFooter />
          <CustomerBottomNav />
        </>
      )}
    </>
  );
}
