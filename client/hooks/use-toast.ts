"use client";

import { create } from "zustand";

import { isAppDebug } from "@/lib/app-flags";
import { getRecentApiError } from "@/lib/httpClient";

export type ToastTone = "default" | "success" | "error" | "info";

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  duration: number;
  /** App Debug only: the raw underlying error detail, shown under the toast. */
  detail?: string;
}

interface ToastStore {
  toasts: ToastData[];
  add: (toast: Omit<ToastData, "id"> & { id?: string }) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = toast.id ?? Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

interface ToastOptions {
  description?: string;
  tone?: ToastTone;
  duration?: number;
  /** Optional explicit error to detail (App Debug). Falls back to the most
   *  recent API failure when omitted. */
  error?: unknown;
}

/** Builds the App-Debug detail line for an error toast, if any is available. */
function debugDetail(options: ToastOptions): string | undefined {
  if (options.tone !== "error" || !isAppDebug()) return undefined;
  if (options.error instanceof Error) return options.error.message;
  if (typeof options.error === "string") return options.error;
  const recent = getRecentApiError();
  if (!recent) return undefined;
  const fields = recent.fieldErrors.map((f) => `${f.property}: ${f.message}`).join(" · ");
  return `${recent.method} ${recent.status} — ${recent.message}${fields ? ` · ${fields}` : ""}`;
}

/** Imperative helper — call from anywhere: toast("Saved", { tone: "success" }). */
export function toast(title: string, options: ToastOptions = {}) {
  const detail = debugDetail(options);
  return useToastStore.getState().add({
    title,
    description: options.description,
    tone: options.tone ?? "default",
    // Give debug detail extra time to be read.
    duration: options.duration ?? (detail ? 10000 : 4000),
    detail,
  });
}
