"use client";

import { useCallback, useEffect, useState } from "react";

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
      } else {
        setShift(await shiftService.clockIn());
      }
    } catch {
    } finally {
      setBusy(false);
    }
  }, [shift]);

  return { shift, onShift: !!shift, loading, busy, toggle, refetch };
}
