import { StorefrontShell } from "@/features/storefront/components/storefront-shell";
import { StorefrontFlash } from "@/features/storefront/components/storefront-flash";
import { SiteChromeProvider } from "@/features/website-builder/render/site-chrome";
import { AnalyticsScripts } from "@/features/analytics/components/analytics-scripts";

// Brand colours come from the real admin settings via SettingsProvider.applyTheme
// (the root provider) — no mock ThemeProvider here, so admin branding is reflected.
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-subtle">
      <AnalyticsScripts />
      <StorefrontFlash />
      <SiteChromeProvider>
        <StorefrontShell>{children}</StorefrontShell>
      </SiteChromeProvider>
    </div>
  );
}
