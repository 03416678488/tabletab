"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSession } from "next-auth/react";

import { openEventStream } from "@/lib/event-stream";
import { resolveApiBaseUrl } from "@/lib/api-base";
import { toast } from "@/hooks/use-toast";
import { playNewOrderChime, primeChime } from "@/features/order/lib/chime";
import { notificationService } from "@/features/notifications/services/notification.service";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import {
  NOTIF_CHANGED_EVENT,
  shouldAlert,
} from "@/features/notifications/lib/notifications-client";
import type {
  AppNotification,
  NotificationPriority,
} from "@/features/notifications/types/notification.types";

const BASE = resolveApiBaseUrl();
/** Coalesce a burst of alerts into a single chime + summary toast. */
const BURST_WINDOW_MS = 1200;

/**
 * The staff notification feed: recent list + unread count, kept live over SSE.
 *
 * Attention is deliberately restrained: only high/critical arrivals chime/toast,
 * a burst collapses into one chime + a "N new" summary, and Do Not Disturb mutes
 * everything but `critical`. The badge always updates so nothing is lost.
 */
export function useNotifications() {
  // Follow the topbar branch switcher — "All branches" scopes to undefined.
  const branchId = useScopedBranchId();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const latestItems = useRef<AppNotification[]>([]);
  const pending = useRef<string[]>([]);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (): Promise<AppNotification[]> => {
    try {
      const [page, count] = await Promise.all([
        notificationService.list({ perPage: 20, ...(branchId ? { branchId } : {}) }),
        notificationService.unreadCount(branchId),
      ]);
      latestItems.current = page.items;
      setItems(page.items);
      setUnread(count);
      return page.items;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  const flush = useCallback(() => {
    const ids = pending.current;
    if (ids.length === 0) return;
    playNewOrderChime();
    if (ids.length === 1) {
      const item = latestItems.current.find((n) => n.id === ids[0]);
      toast(item?.title ?? "New notification", { tone: "default" });
    } else {
      toast(`${ids.length} new notifications`, { tone: "default" });
    }
    pending.current = [];
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Refresh when another surface (a board auto-reading, DND toggle) signals.
  useEffect(() => {
    const onChanged = () => void load();
    window.addEventListener(NOTIF_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(NOTIF_CHANGED_EVENT, onChanged);
  }, [load]);

  // Live stream.
  useEffect(() => {
    if (typeof window === "undefined") return;
    primeChime();
    const close = openEventStream(`${BASE}/notifications/stream`, {
      getToken: async () => (await getSession())?.accessToken,
      onOpen: () => setConnected(true),
      onError: () => setConnected(false),
      onEvent: (d) => {
        if (d.event === "ping") return;
        void load(); // badge always reconciles
        // Don't chime for another branch's event while scoped to one branch
        // (branch-less/global events still alert).
        const evBranch = d.branchId ? String(d.branchId) : null;
        if (branchId && evBranch && evBranch !== branchId) return;
        const priority = String(d.priority ?? "normal") as NotificationPriority;
        const category = String(d.category ?? "");
        if (!shouldAlert(priority, category)) return;
        pending.current.push(String(d.id ?? ""));
        if (flushTimer.current) clearTimeout(flushTimer.current);
        flushTimer.current = setTimeout(flush, BURST_WINDOW_MS);
      },
    });
    return () => {
      close();
      if (flushTimer.current) clearTimeout(flushTimer.current);
    };
  }, [load, flush, branchId]);

  const markRead = useCallback(
    async (id: string) => {
      setItems((prev) =>
        prev.map((n) =>
          n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
      setUnread((u) => Math.max(0, u - 1));
      try {
        await notificationService.markRead(id);
      } catch {
        void load();
      }
    },
    [load],
  );

  const markAllRead = useCallback(async () => {
    setItems((prev) =>
      prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
    );
    setUnread(0);
    try {
      await notificationService.markAllRead();
    } catch {
      void load();
    }
  }, [load]);

  return { items, unread, loading, connected, refetch: load, markRead, markAllRead };
}
