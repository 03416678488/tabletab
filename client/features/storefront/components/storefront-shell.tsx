"use client";

import { useSettings } from "@/features/app-settings/components/settings-provider";
import { CustomerBottomNav } from "@/features/storefront/components/customer-bottom-nav";
import { StorefrontFooter } from "@/features/storefront/components/storefront-footer";
import { StorefrontHeader } from "@/features/storefront/components/storefront-header";
import { StorefrontSkeleton } from "@/features/storefront/components/storefront-skeleton";

/**
 * Holds the storefront chrome behind a full-page skeleton until branding/settings
 * resolve — so the header/footer never flash default/placeholder branding.
 */
export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const { loading } = useSettings();

  if (loading) return <StorefrontSkeleton />;

  return (
    <>
      <StorefrontHeader />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <StorefrontFooter />
      <CustomerBottomNav />
    </>
  );
}
