"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { toast } from "@/hooks/use-toast";
import { shiftService } from "@/features/shift/services/shift.service";
import type { Shift } from "@/features/shift/types/shift.types";

/** Tracks the signed-in staff member's on-shift state and toggles it. */
export function useShift() {
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setShift(await shiftService.current());
    } catch {
      setShift(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const toggle = useCallback(async () => {
    setBusy(true);
    try {
      if (shift) {
        await shiftService.clockOut();
        setShift(null);
        toast("Clocked out — you're off duty", { tone: "success" });
      } else {
        setShift(await shiftService.clockIn());
        toast("Clocked in — you'll now receive assignments", { tone: "success" });
      }
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't update shift", { tone: "error" });
    } finally {
      setBusy(false);
    }
  }, [shift]);

  return { shift, onShift: !!shift, loading, busy, toggle, refetch };
}
