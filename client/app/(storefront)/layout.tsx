import { StorefrontShell } from "@/features/storefront/components/storefront-shell";
import { SiteChromeProvider } from "@/features/website-builder/render/site-chrome";

// Brand colours come from the real admin settings via SettingsProvider.applyTheme
// (the root provider) — no mock ThemeProvider here, so admin branding is reflected.
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-subtle">
      <SiteChromeProvider>
        <StorefrontShell>{children}</StorefrontShell>
      </SiteChromeProvider>
    </div>
  );
}
