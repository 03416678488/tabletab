"use client";

import { create } from "zustand";

export type FlashTone = "default" | "success" | "error" | "info";

export interface FlashMessage {
  id: string;
  title: string;
  description?: string;
  tone: FlashTone;
}

interface FlashStore {
  messages: FlashMessage[];
  push: (m: Omit<FlashMessage, "id">) => string;
  dismiss: (id: string) => void;
}

export const useFlashStore = create<FlashStore>((set) => ({
  messages: [],
  push: (m) => {
    const id = Math.random().toString(36).slice(2);
    // Keep at most 3 stacked so the storefront never gets a wall of banners.
    set((s) => ({ messages: [...s.messages, { ...m, id }].slice(-3) }));
    return id;
  },
  dismiss: (id) => set((s) => ({ messages: s.messages.filter((x) => x.id !== id) })),
}));

interface FlashOptions {
  description?: string;
  tone?: FlashTone;
}

/**
 * Storefront inline message — a drop-in for `toast()` (same signature) that
 * renders as an in-page banner under the header instead of a floating toast.
 * Use this on customer-facing pages; staff surfaces keep the corner toast.
 */
export function flash(title: string, options: FlashOptions = {}) {
  return useFlashStore.getState().push({
    title,
    description: options.description,
    tone: options.tone ?? "default",
  });
}
