"use client";

import type { CreateOrderInput } from "@/features/order/types/order.types";
import type { MenuItem } from "@/features/menu/types/menu.types";

/**
 * localStorage-backed offline store for the POS: a cached menu snapshot (so the
 * terminal still renders products with no network) and a queue of orders taken
 * while offline (replayed to the API on reconnect). Small payloads — a few
 * hundred items + a handful of pending orders fit comfortably.
 */

const MENU_KEY = "tabletap.offline.menu";
const QUEUE_KEY = "tabletap.offline.queue";

/** Broadcast so every mounted hook re-reads the queue after a change. */
export const OFFLINE_QUEUE_EVENT = "offline:queue-changed";

export interface QueuedOrder {
  /** Local id (also the provisional order number shown until synced). */
  localId: string;
  payload: CreateOrderInput;
  createdAt: string;
  status: "pending" | "failed";
  error?: string;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / disabled storage — best-effort
  }
}

// ── Menu snapshot ────────────────────────────────────────────────────────────

export function saveMenuSnapshot(items: MenuItem[]): void {
  if (items.length) write(MENU_KEY, items);
}

export function loadMenuSnapshot(): MenuItem[] {
  return read<MenuItem[]>(MENU_KEY, []);
}

// ── Order queue ──────────────────────────────────────────────────────────────

export function getQueue(): QueuedOrder[] {
  return read<QueuedOrder[]>(QUEUE_KEY, []);
}

function setQueue(queue: QueuedOrder[]): void {
  write(QUEUE_KEY, queue);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OFFLINE_QUEUE_EVENT));
  }
}

export function enqueueOrder(payload: CreateOrderInput): QueuedOrder {
  const order: QueuedOrder = {
    localId: `OFF-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
    payload,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  setQueue([...getQueue(), order]);
  return order;
}

export function removeFromQueue(localId: string): void {
  setQueue(getQueue().filter((o) => o.localId !== localId));
}

export function markQueueItemFailed(localId: string, error: string): void {
  setQueue(getQueue().map((o) => (o.localId === localId ? { ...o, status: "failed", error } : o)));
}

/** Reset a failed order back to pending so it's retried on the next sync. */
export function retryQueueItem(localId: string): void {
  setQueue(
    getQueue().map((o) =>
      o.localId === localId ? { ...o, status: "pending", error: undefined } : o,
    ),
  );
}
