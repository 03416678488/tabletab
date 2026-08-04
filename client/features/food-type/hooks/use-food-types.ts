"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { foodTypeService } from "@/features/food-type/services/food-type.service";
import type { FoodType } from "@/features/food-type/types/food-type.types";

export function useFoodTypes() {
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await foodTypeService.list({ perPage: 100 });
      setFoodTypes(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load food types");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { foodTypes, loading, error, refetch };
}
