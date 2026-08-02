"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { kioskMachineService } from "@/features/kiosk-machine/services/kiosk-machine.service";
import type { KioskMachine } from "@/features/kiosk-machine/types/kiosk-machine.types";

export function useKioskMachines() {
  const [machines, setMachines] = useState<KioskMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMachines(await kioskMachineService.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load kiosk machines");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { machines, loading, error, refetch };
}
