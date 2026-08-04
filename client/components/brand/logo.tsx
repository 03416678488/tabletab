"use client";

import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/features/app-settings/components/settings-provider";

interface LogoProps {
  href?: string;
  className?: string;
  /** Render on a dark surface (e.g. kitchen display). */
  dark?: boolean;
  showWordmark?: boolean;
}

export function Logo({ href = "/", className, dark = false, showWordmark = true }: LogoProps) {
  const { get, loading } = useSettings();
  // Whitelabel: logo from Settings → Branding, name + tagline from Business Info.
  const logoUrl = get("theme", "logo");
  const name = get("company", "name");
  const tagline = get("company", "tagline");

  // Until settings resolve, show a skeleton instead of a hardcoded brand flash.
  if (loading) {
    return (
      <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
        <span className="size-9 shrink-0 animate-pulse rounded-xl bg-black/10" />
        {showWordmark && <span className="h-4 w-24 animate-pulse rounded bg-black/10" />}
      </span>
    );
  }

  const content = (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      {logoUrl ? (
        // Plain <img>: the uploaded file is served by our API (the next/image
        // optimizer refuses localhost hosts) and the logo has no fixed size.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={`${name} logo`} className="h-9 w-auto max-w-[120px] shrink-0 object-contain" />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
          <UtensilsCrossed className="size-5" aria-hidden />
        </span>
      )}
      {showWordmark && name && (
        <span className="flex min-w-0 flex-col leading-none">
          <span
            className={cn(
              "truncate font-display text-[17px] font-bold tracking-tight",
              dark ? "text-white" : "text-ink",
            )}
          >
            {name}
          </span>
          {tagline && (
            <span
              className={cn("truncate text-[11px]", dark ? "text-slate-400" : "text-muted-foreground")}
            >
              {tagline}
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
      </Link>
    );
  }
  return content;
}
