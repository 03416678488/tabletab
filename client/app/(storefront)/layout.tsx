import { ThemeProvider } from "@/components/brand/theme-provider";
import { StorefrontShell } from "@/features/storefront/components/storefront-shell";
import { SiteChromeProvider } from "@/features/website-builder/render/site-chrome";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider className="flex min-h-full flex-col bg-subtle">
      <SiteChromeProvider>
        <StorefrontShell>{children}</StorefrontShell>
      </SiteChromeProvider>
    </ThemeProvider>
  );
}
