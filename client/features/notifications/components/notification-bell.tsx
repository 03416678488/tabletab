"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  CheckCheck,
  CreditCard,
  Moon,
  ShoppingBag,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import { isDnd, setDnd } from "@/features/notifications/lib/notifications-client";
import { notificationHref } from "@/features/notifications/lib/deep-link";
import type { AppNotification } from "@/features/notifications/types/notification.types";

const ICON_BTN =
  "relative inline-flex size-9 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Category → icon for the row glyph (extend as new categories land). */
const CATEGORY_ICON: Record<string, LucideIcon> = {
  orders: ShoppingBag,
  reservations: CalendarClock,
  payments: CreditCard,
  register: Wallet,
};

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function NotificationBell() {
  const { items, unread, loading, markRead, markAllRead } = useNotifications();
  const role = useSession((s) => s.user?.role);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dnd, setDndState] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => setDndState(isDnd()), []);
  const toggleDnd = () => {
    const next = !dnd;
    setDndState(next);
    setDnd(next);
  };

  const openNotification = (n: AppNotification) => {
    if (!n.readAt) void markRead(n.id);
    setOpen(false);
    const href = role ? notificationHref(role, n) : null;
    if (href) router.push(href);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        className={cn(ICON_BTN, "bg-amber-50 text-amber-600 hover:bg-amber-100")}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-surface">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-elevated)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-display text-sm font-semibold text-ink">
              Notifications
            </span>
            <div className="flex items-center gap-3">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                >
                  <CheckCheck className="size-3.5" /> Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={toggleDnd}
                aria-pressed={dnd}
                title={dnd ? "Do Not Disturb is on — critical only" : "Do Not Disturb"}
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-md transition-colors",
                  dnd ? "bg-brand text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
                )}
              >
                <Moon className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                You&apos;re all caught up.
              </p>
            ) : (
              items.map((n) => (
                <NotificationRow key={n.id} n={n} onClick={() => openNotification(n)} />
              ))
            )}
          </div>

          {role && (
            <Link
              href={`/${role}/notifications`}
              onClick={() => setOpen(false)}
              className="block border-t border-border px-4 py-2.5 text-center text-xs font-medium text-brand hover:bg-secondary/60"
            >
              View all notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationRow({ n, onClick }: { n: AppNotification; onClick: () => void }) {
  const Icon = CATEGORY_ICON[n.category] ?? Bell;
  const unread = !n.readAt;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-secondary/60",
        unread && "bg-brand-tint/30",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
          unread ? "bg-brand-tint text-brand-deep" : "bg-secondary text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
            {n.title}
          </span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {timeAgo(n.createdAt)}
          </span>
        </span>
        {n.body && (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{n.body}</span>
        )}
      </span>
      {unread && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" />}
    </button>
  );
}
