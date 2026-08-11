"use client";

import { toast as sonnerToast } from "sonner";

import { isAppDebug } from "@/lib/app-flags";
import { getRecentApiError } from "@/lib/httpClient";

export type ToastTone = "default" | "success" | "error" | "info";

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

/**
 * Imperative helper — call from anywhere: `toast("Saved", { tone: "success" })`.
 * Backed by Sonner (shadcn's toast); the tone maps to Sonner's success/error/
 * info variants, and App-Debug error detail is appended to the description.
 */
export function toast(title: string, options: ToastOptions = {}) {
  const detail = debugDetail(options);
  const description = [options.description, detail].filter(Boolean).join(" — ") || undefined;
  const duration = options.duration ?? (detail ? 10000 : 4000);
  const opts = { description, duration };

  switch (options.tone) {
    case "success":
      return sonnerToast.success(title, opts);
    case "error":
      return sonnerToast.error(title, opts);
    case "info":
      return sonnerToast.info(title, opts);
    default:
      return sonnerToast(title, opts);
  }
}
