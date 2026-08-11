"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS, hrefFor, navItemsForRole, type NavItem } from "@/lib/nav";
import { useSession } from "@/hooks/use-session";
import { useMyAccess } from "@/features/role-permission/hooks/use-my-access";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import type { StaffRole } from "@/lib/types";
import { useMemo } from "react";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const role = useSession((s) => s.user!.role);
  const { canView } = useMyAccess();

  // Unread-count badges: "all" = total unread (mirrors the bell); a category key
  // = unread of that category in the live feed. Same source as the bell.
  const { items: feed, unread } = useNotifications();
  const badgeFor = useMemo(() => {
    const byCategory: Record<string, number> = {};
    for (const n of feed) if (!n.readAt) byCategory[n.category] = (byCategory[n.category] ?? 0) + 1;
    return (key?: string) => (!key ? 0 : key === "all" ? unread : (byCategory[key] ?? 0));
  }, [feed, unread]);

  // Role-visible items, then filtered by the user's module permissions.
  const items = navItemsForRole(role)
    .map((item) =>
      item.children ? { ...item, children: item.children.filter((c) => canView(c.module)) } : item,
    )
    .filter((item) => (item.children ? item.children.length > 0 : canView(item.module)));

  const linkClass = (active: boolean) =>
    cn(
      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active ? "bg-brand-tint text-brand-deep" : "text-slate-600 hover:bg-secondary hover:text-ink",
    );

  return (
    <nav className="flex flex-col gap-5 px-3 py-4" aria-label="Staff navigation">
      {NAV_SECTIONS.map((section) => {
        const sectionItems = items.filter((i) => i.section === section);
        if (sectionItems.length === 0) return null;
        return (
          <div key={section}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
              {section}
            </p>
            <ul className="flex flex-col gap-0.5">
              {sectionItems.map((item) =>
                item.children ? (
                  <DropdownItem
                    key={item.label}
                    item={item}
                    role={role}
                    pathname={pathname}
                    linkClass={linkClass}
                    onNavigate={onNavigate}
                  />
                ) : (
                  <LeafItem
                    key={item.slug}
                    item={item}
                    role={role}
                    pathname={pathname}
                    linkClass={linkClass}
                    onNavigate={onNavigate}
                    badge={badgeFor(item.badgeCategory)}
                  />
                ),
              )}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function LeafItem({
  item,
  role,
  pathname,
  linkClass,
  onNavigate,
  badge = 0,
}: {
  item: NavItem;
  role: StaffRole;
  pathname: string;
  linkClass: (active: boolean) => string;
  onNavigate?: () => void;
  badge?: number;
}) {
  const href = hrefFor(role, item.slug!);
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={linkClass(active)}
      >
        <Icon
          className={cn(
            "size-[18px] transition-colors",
            active ? "text-brand-deep" : "text-slate-400 group-hover:text-ink",
          )}
          aria-hidden
        />
        {item.label}
        {badge > 0 && (
          <span
            aria-label={`${badge} unread`}
            className="ml-auto inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold leading-4 text-white"
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </Link>
    </li>
  );
}

function DropdownItem({
  item,
  role,
  pathname,
  linkClass,
  onNavigate,
}: {
  item: NavItem;
  role: StaffRole;
  pathname: string;
  linkClass: (active: boolean) => string;
  onNavigate?: () => void;
}) {
  const children = item.children ?? [];
  const childHref = (slug: string) => hrefFor(role, slug);
  const hasActiveChild = children.some((c) => {
    const h = childHref(c.slug);
    return pathname === h || pathname.startsWith(`${h}/`);
  });
  const [open, setOpen] = useState(hasActiveChild);
  const Icon = item.icon;

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(linkClass(false), "w-full")}
      >
        <Icon
          className={cn(
            "size-[18px] transition-colors",
            hasActiveChild ? "text-brand-deep" : "text-slate-400 group-hover:text-ink",
          )}
          aria-hidden
        />
        {item.label}
        <ChevronDown
          className={cn(
            "ml-auto size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <ul className="mt-0.5 flex flex-col gap-0.5 border-l border-border pl-3 ml-[18px]">
          {children.map((child) => {
            const href = childHref(child.slug);
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={child.label}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-lg px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-brand-tint font-medium text-brand-deep"
                      : "text-slate-500 hover:bg-secondary hover:text-ink",
                  )}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
