import { ThemeProvider } from "@/components/brand/theme-provider";
import { CustomerBottomNav } from "@/features/storefront/components/customer-bottom-nav";
import { StorefrontFooter } from "@/features/storefront/components/storefront-footer";
import { StorefrontHeader } from "@/features/storefront/components/storefront-header";
import { SiteChromeProvider } from "@/features/website-builder/render/site-chrome";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider className="flex min-h-full flex-col bg-subtle">
      <SiteChromeProvider>
        <StorefrontHeader />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <StorefrontFooter />
        <CustomerBottomNav />
      </SiteChromeProvider>
    </ThemeProvider>
  );
}
