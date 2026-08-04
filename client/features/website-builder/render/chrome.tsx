import Link from "next/link";
import { MapPin, Search, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FooterConfig, HeaderConfig } from "@/features/website-builder/schemas/blocks";

export function SiteHeaderRender({ config }: { config: HeaderConfig }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <span className="flex size-8 items-center justify-center rounded-xl bg-brand text-primary-foreground">
            <UtensilsCrossed className="size-4" />
          </span>
          {config.brandName}
        </Link>

        <nav className="ml-2 hidden items-center gap-5 md:flex">
          {config.links.map((l, i) => (
            <Link
              key={i}
              href={l.href || "#"}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {config.showLocation && (
            <button
              type="button"
              className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground sm:flex"
            >
              <MapPin className="size-4" /> Location
            </button>
          )}
          {config.showSearch && (
            <button
              type="button"
              aria-label="Search"
              className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground"
            >
              <Search className="size-4" />
            </button>
          )}
          {config.ctaLabel && (
            <Link
              href={config.ctaHref || "/order"}
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover"
            >
              {config.ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooterRender({ config }: { config: FooterConfig }) {
  return (
    <footer className="mt-8 border-t border-border bg-subtle">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          {config.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logoUrl} alt="Logo" className="h-10 w-auto max-w-[180px] object-contain" />
          ) : (
            <p className="font-display text-lg font-bold text-ink">Restaurant</p>
          )}
          {config.about && (
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">{config.about}</p>
          )}
          {config.socials.length > 0 && (
            <div className="mt-3 flex gap-3">
              {config.socials.map((s, i) => (
                <Link
                  key={i}
                  href={s.href || "#"}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  {s.platform}
                </Link>
              ))}
            </div>
          )}
        </div>

        {config.columns.map((col, i) => (
          <div key={i}>
            <p className="text-sm font-semibold text-ink">{col.heading}</p>
            <ul className="mt-2 space-y-1.5">
              {col.links.map((l, j) => (
                <li key={j}>
                  <Link
                    href={l.href || "#"}
                    className="text-sm text-muted-foreground transition-colors hover:text-ink"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {config.copyright && (
        <div className={cn("border-t border-border py-4 text-center text-xs text-muted-foreground")}>
          {config.copyright}
        </div>
      )}
    </footer>
  );
}
