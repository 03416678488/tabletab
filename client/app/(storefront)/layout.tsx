import { ThemeProvider } from "@/components/brand/theme-provider";
import { CustomerBottomNav } from "@/features/storefront/components/customer-bottom-nav";
import { StorefrontFooter } from "@/features/storefront/components/storefront-footer";
import { StorefrontHeader } from "@/features/storefront/components/storefront-header";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider className="flex min-h-full flex-col bg-subtle">
      <StorefrontHeader />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <StorefrontFooter />
      <CustomerBottomNav />
    </ThemeProvider>
  );
}
