"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItemsForRole } from "@/lib/nav";
import { useSession } from "@/hooks/use-session";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const role = useSession((s) => s.user!.role);
  const items = navItemsForRole(role);

  const sections = ["Operations", "Management"] as const;

  return (
    <nav className="flex flex-col gap-6 px-3 py-4" aria-label="Staff navigation">
      {sections.map((section) => {
        const sectionItems = items.filter((i) => i.section === section);
        if (sectionItems.length === 0) return null;
        return (
          <div key={section}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section}
            </p>
            <ul className="flex flex-col gap-1">
              {sectionItems.map((item) => {
                const active =
                  item.href === "/app"
                    ? pathname === "/app"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "bg-brand-tint text-brand-deep"
                          : "text-slate-600 hover:bg-secondary hover:text-ink",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg transition-colors",
                          active
                            ? "bg-brand text-white shadow-sm"
                            : "bg-secondary text-slate-500 group-hover:text-ink",
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
