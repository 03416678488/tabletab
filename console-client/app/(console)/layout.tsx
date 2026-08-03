import Link from "next/link";
import { LayoutDashboard, Building2 } from "lucide-react";

/** Platform console shell — the top-level admin for managing all tenants. */
export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-subtle">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/tenants" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <span className="flex size-8 items-center justify-center rounded-xl bg-brand text-primary-foreground">
              <LayoutDashboard className="size-4" />
            </span>
            TableTap <span className="text-brand">Console</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/tenants"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-secondary"
            >
              <Building2 className="size-4" /> Tenants
            </Link>
            <span className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground/60">
              Plans · soon
            </span>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
