"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { qrCodeService } from "@/features/qr-code/services/qr-code.service";
import type { QrCode } from "@/features/qr-code/types/qr-code.types";

export function useQrCodes(branchId?: string) {
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await qrCodeService.list({ perPage: 100, ...(branchId ? { branchId } : {}) });
      setQrCodes(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load QR codes");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { qrCodes, loading, error, refetch };
}
