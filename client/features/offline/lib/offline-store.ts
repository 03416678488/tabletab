"use client";

import type { CreateOrderInput } from "@/features/order/types/order.types";
import type { MenuItem } from "@/features/menu/types/menu.types";
import { idbGet, idbSet } from "@/features/offline/lib/idb";

/**
 * Offline store for the POS. The menu snapshot (potentially large — hundreds of
 * items with variants/add-ons) lives in IndexedDB; the small order queue stays
 * in localStorage (read synchronously by the sync loop).
 */

const MENU_KEY = "menu";
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

// ── Menu snapshot (IndexedDB) ────────────────────────────────────────────────

export async function saveMenuSnapshot(items: MenuItem[]): Promise<void> {
  if (items.length) await idbSet(MENU_KEY, items);
}

export async function loadMenuSnapshot(): Promise<MenuItem[]> {
  return (await idbGet<MenuItem[]>(MENU_KEY)) ?? [];
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
