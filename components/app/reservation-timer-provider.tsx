"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";

/** Runs mock reservation timers on staff surfaces. */
export function ReservationTimerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void api.runReservationTimers();
    const id = setInterval(() => {
      void api.runReservationTimers();
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  return children;
}
