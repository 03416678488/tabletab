"use client";

import { create } from "zustand";

export type ToastTone = "default" | "success" | "error" | "info";

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  duration: number;
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
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

interface ToastOptions {
  description?: string;
  tone?: ToastTone;
  duration?: number;
}

/** Imperative helper — call from anywhere: toast("Saved", { tone: "success" }). */
export function toast(title: string, options: ToastOptions = {}) {
  return useToastStore.getState().add({
    title,
    description: options.description,
    tone: options.tone ?? "default",
    duration: options.duration ?? 4000,
  });
}
