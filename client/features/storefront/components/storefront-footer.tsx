"use client";

import Link from "next/link";
import { TenantLogo } from "@/components/brand/tenant-logo";
import { useSettings } from "@/features/app-settings/components/settings-provider";
import { useTenant } from "@/hooks/use-tenant";
import { useSiteFooterConfig } from "@/features/website-builder/render/site-chrome";

export function StorefrontFooter() {
  const tenant = useTenant();
  const { get } = useSettings();
  const year = new Date().getFullYear();
  const brandName = get("company", "name") || tenant.name;

  // Every footer link comes from the website builder — no hardcoded/placeholder
  // links. An unconfigured site shows just the brand block and copyright.
  const footerCfg = useSiteFooterConfig();
  const columns = (footerCfg?.columns ?? [])
    .map((c) => ({ title: c.heading, links: c.links }))
    .filter((c) => c.title.trim() && c.links.length > 0);
  const about = footerCfg?.about?.trim() || "";
  const copyright =
    footerCfg?.copyright?.trim() || `© ${year} ${brandName}. All rights reserved.`;
  const socials = (footerCfg?.socials ?? []).filter((s) => s.platform.trim());

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <TenantLogo href="/" showTagline />
            {about && (
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{about}</p>
            )}
            {socials.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {socials.map((s, i) => (
                  <a
                    key={i}
                    href={s.href || "#"}
                    className="flex h-9 items-center rounded-full border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-brand hover:bg-brand-tint hover:text-brand"
                  >
                    {s.platform}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-sm font-semibold text-ink">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
