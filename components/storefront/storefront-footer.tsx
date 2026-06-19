"use client";

import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";

export function StorefrontFooter() {
  const tenant = useTenant();

  return (
    <footer className="mt-auto border-t border-border bg-surface/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-sm font-semibold text-ink">{tenant.name}</p>
          <p className="text-sm text-muted-foreground">{tenant.tagline}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/order" className="hover:text-brand">
            Order online
          </Link>
          <Link href="/login" className="hover:text-brand">
            Sign in
          </Link>
          <Link href="/app/login" className="hover:text-brand">
            Staff portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
