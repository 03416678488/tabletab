"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { timeSlotService } from "@/features/time-slot/services/time-slot.service";
import type { TimeSlot } from "@/features/time-slot/types/time-slot.types";

export function useTimeSlots() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSlots(await timeSlotService.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load time slots");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { slots, loading, error, refetch };
}
