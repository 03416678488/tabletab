"use client";

import { useCallback, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { mediaService } from "@/features/media/services/media.service";
import type { MediaFile } from "@/features/media/types/media.types";

export function useMedia() {
  const [images, setImages] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setImages(await mediaService.listImages());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load images");
    } finally {
      setLoading(false);
    }
  }, []);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const uploaded = await mediaService.uploadImage(file);
      setImages((prev) => [uploaded, ...prev]);
      return uploaded;
    } finally {
      setUploading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    await mediaService.remove(id);
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  return { images, loading, error, uploading, refetch, upload, remove };
}
