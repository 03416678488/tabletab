"use client";

import Image from "next/image";
import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";
import { resolveBranding } from "@/lib/theme";
import type { TenantBranding } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TenantLogoProps {
  href?: string;
  className?: string;
  /** Compact row for venue header; default is full storefront size. */
  variant?: "default" | "compact";
  showTagline?: boolean;
  /** Optional override for settings preview. */
  branding?: TenantBranding;
}

export function TenantLogo({
  href,
  className,
  variant = "default",
  showTagline = false,
  branding: brandingOverride,
}: TenantLogoProps) {
  const tenant = useTenant();
  const branding = resolveBranding(brandingOverride ?? tenant.branding);
  const { name, tagline } = tenant;
  const logoSrc = branding.logoDataUrl ?? branding.logoUrl;
  const compact = variant === "compact";

  const content = (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      {logoSrc ? (
        <span
          className={cn(
            "relative shrink-0 overflow-hidden rounded-xl bg-subtle ring-1 ring-border",
            compact ? "size-9" : "size-10",
          )}
        >
          <Image
            src={logoSrc}
            alt={`${name} logo`}
            fill
            className="object-contain p-0.5"
            sizes={compact ? "36px" : "40px"}
            unoptimized={logoSrc.startsWith("data:")}
          />
        </span>
      ) : (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-brand text-primary-foreground shadow-sm",
            compact ? "size-9" : "size-10",
          )}
        >
          <UtensilsCrossed className={cn(compact ? "size-4" : "size-5")} aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex flex-col leading-none">
        <span
          className={cn(
            "truncate font-display font-bold tracking-tight text-ink",
            compact ? "text-sm" : "text-[17px]",
          )}
        >
          {name}
        </span>
        {showTagline && tagline && (
          <span className="truncate text-[11px] text-muted-foreground">{tagline}</span>
        )}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
      </Link>
    );
  }

  return content;
}
