"use client";

import Link from "next/link";
import { TenantLogo } from "@/components/brand/tenant-logo";
import { useSettings } from "@/features/app-settings/components/settings-provider";
import { useTenant } from "@/hooks/use-tenant";
import { useSiteFooterConfig } from "@/features/website-builder/render/site-chrome";

interface FooterLink {
  label: string;
  href: string;
}

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Order",
    links: [
      { label: "Order online", href: "/order" },
      { label: "Reserve a table", href: "/order" },
      { label: "Your cart", href: "/checkout" },
      { label: "My account", href: "/account" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "#" },
      { label: "Our locations", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help center", href: "#" },
      { label: "Contact us", href: "#" },
      { label: "Delivery info", href: "#" },
      { label: "Staff portal", href: "/login" },
    ],
  },
];

const SOCIALS: { label: string; href: string; icon: React.ReactNode }[] = [
  { label: "Instagram", href: "#", icon: <IconInstagram /> },
  { label: "Facebook", href: "#", icon: <IconFacebook /> },
  { label: "X", href: "#", icon: <IconX /> },
];

export function StorefrontFooter() {
  const tenant = useTenant();
  const { get } = useSettings();
  const year = new Date().getFullYear();
  const brandName = get("company", "name") || tenant.name;

  // Footer customisation from the website builder (falls back to defaults).
  const footerCfg = useSiteFooterConfig();
  const columns =
    footerCfg && footerCfg.columns.length > 0
      ? footerCfg.columns.map((c) => ({ title: c.heading, links: c.links }))
      : COLUMNS;
  const about =
    footerCfg?.about?.trim() ||
    "Fresh Mediterranean plates, wood-fired pizza, and signature mains — delivered to your door or ready for pickup.";
  const copyright =
    footerCfg?.copyright?.trim() || `© ${year} ${brandName}. All rights reserved.`;
  const configSocials = footerCfg?.socials?.filter((s) => s.platform.trim()) ?? [];

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <TenantLogo href="/" showTagline />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{about}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {configSocials.length > 0
                ? configSocials.map((s, i) => (
                    <a
                      key={i}
                      href={s.href || "#"}
                      className="flex h-9 items-center rounded-full border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-brand hover:bg-brand-tint hover:text-brand"
                    >
                      {s.platform}
                    </a>
                  ))
                : SOCIALS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      aria-label={s.label}
                      className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-brand hover:bg-brand-tint hover:text-brand"
                    >
                      {s.icon}
                    </a>
                  ))}
            </div>
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
        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{copyright}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link href="#" className="transition-colors hover:text-brand">
              Privacy Policy
            </Link>
            <Link href="#" className="transition-colors hover:text-brand">
              Terms of Service
            </Link>
            <Link href="#" className="transition-colors hover:text-brand">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* --- Inline brand icons (lucide has no brand marks in this version) --- */

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}
