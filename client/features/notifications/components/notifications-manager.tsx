"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  CheckCheck,
  CreditCard,
  ShoppingBag,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { TableRowsSkeleton } from "@/components/ui/table-rows-skeleton";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";

import { usePaginatedNotifications } from "@/features/notifications/hooks/use-paginated-notifications";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import { notificationService } from "@/features/notifications/services/notification.service";
import { broadcastNotificationsChanged } from "@/features/notifications/lib/notifications-client";
import { notificationHref } from "@/features/notifications/lib/deep-link";
import { NotificationPreferences } from "@/features/notifications/components/notification-preferences";
import type { AppNotification } from "@/features/notifications/types/notification.types";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  orders: ShoppingBag,
  reservations: CalendarClock,
  payments: CreditCard,
  register: Wallet,
};

const TABS = [
  { key: "all", label: "All" },
  { key: "orders", label: "Orders" },
  { key: "reservations", label: "Reservations" },
  { key: "payments", label: "Payments" },
  { key: "register", label: "Register" },
  { key: "settings", label: "Settings" },
];

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function NotificationsManager() {
  const role = useSession((s) => s.user?.role);
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Follow the topbar branch switcher — "All branches" scopes to undefined.
  const branchId = useScopedBranchId();

  const isSettings = tab === "settings";
  const {
    items,
    loading,
    error,
    page,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    goToPage,
    refetch,
  } = usePaginatedNotifications({
    category: tab === "all" || isSettings ? undefined : tab,
    status: unreadOnly ? "unread" : undefined,
    branchId,
  });

  const open = (n: AppNotification) => {
    if (!n.readAt) {
      void notificationService.markRead(n.id).then(() => {
        broadcastNotificationsChanged();
        refetch();
      });
    }
    const href = role ? notificationHref(role, n) : null;
    if (href) router.push(href);
  };

  const markAll = () =>
    void notificationService.markAllRead().then(() => {
      broadcastNotificationsChanged();
      refetch();
    });

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
            <Bell className="size-5 text-brand" /> Notifications
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isSettings
              ? "Control how and when you're alerted."
              : `${totalItems} notification${totalItems === 1 ? "" : "s"}.`}
          </p>
        </div>
        {!isSettings && (
          <div className="flex items-center gap-2">
            <Button
              variant={unreadOnly ? "secondary" : "outline"}
              size="sm"
              onClick={() => setUnreadOnly((v) => !v)}
            >
              Unread only
            </Button>
            <Button variant="outline" size="sm" onClick={markAll}>
              <CheckCheck className="size-4" /> Mark all read
            </Button>
          </div>
        )}
      </div>

      <SegmentedTabs
        className="mt-4"
        aria-label="Notification category"
        value={tab}
        onChange={setTab}
        tabs={TABS}
      />

      {isSettings ? (
        <div className="mt-5">
          <NotificationPreferences />
        </div>
      ) : (
        <>
          <Card className="mt-4 overflow-hidden p-0">
            {loading ? (
              <TableRowsSkeleton />
            ) : error ? (
              <EmptyState className="py-12" icon={Bell} title="Couldn't load" description={error} />
            ) : items.length === 0 ? (
              <EmptyState
                className="py-12"
                icon={Bell}
                title={unreadOnly ? "Nothing unread" : "No notifications"}
                description={
                  unreadOnly ? "You're all caught up." : "New activity will appear here."
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => {
                  const Icon = CATEGORY_ICON[n.category] ?? Bell;
                  const unread = !n.readAt;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => open(n)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60",
                          unread && "bg-brand-tint/30",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                            unread
                              ? "bg-brand-tint text-brand-deep"
                              : "bg-secondary text-muted-foreground",
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="min-w-0 flex-1 truncate font-medium text-ink">
                              {n.title}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {timeLabel(n.createdAt)}
                            </span>
                          </span>
                          {n.body && (
                            <span className="mt-0.5 block text-sm text-muted-foreground">
                              {n.body}
                            </span>
                          )}
                        </span>
                        {unread && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {!loading && !error && items.length > 0 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={goToPage}
              perPage={perPage}
              onPerPageChange={setPerPage}
              className="mt-4"
            />
          )}
        </>
      )}
    </div>
  );
}
