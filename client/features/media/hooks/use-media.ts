"use client";

import { useCallback, useState } from "react";

import { ApiError } from "@/lib/httpClient";
import { mediaService } from "@/features/media/services/media.service";
import type { MediaFile, MediaFolder } from "@/features/media/types/media.types";

export function useMedia() {
  const [images, setImages] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  /** null = root (uncategorised images). */
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  /** Load folders + the images for a given folder (defaults to the current one). */
  const refetch = useCallback(
    async (folderId: string | null = currentFolderId) => {
      setLoading(true);
      setError(null);
      try {
        const [imgs, fldrs] = await Promise.all([
          mediaService.listImages(folderId),
          mediaService.listFolders(),
        ]);
        setImages(imgs);
        setFolders(fldrs);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load images");
      } finally {
        setLoading(false);
      }
    },
    [currentFolderId],
  );

  const openFolder = useCallback(
    (folderId: string | null) => {
      setCurrentFolderId(folderId);
      void refetch(folderId);
    },
    [refetch],
  );

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const uploaded = await mediaService.uploadImage(file, currentFolderId);
        setImages((prev) => [uploaded, ...prev]);
        // Keep folder counts fresh.
        void mediaService.listFolders().then(setFolders);
        return uploaded;
      } finally {
        setUploading(false);
      }
    },
    [currentFolderId],
  );

  const remove = useCallback(async (id: string) => {
    await mediaService.remove(id);
    setImages((prev) => prev.filter((img) => img.id !== id));
    void mediaService.listFolders().then(setFolders);
  }, []);

  /** Create a folder under an explicit parent (null = top level). */
  const createFolder = useCallback(async (name: string, parentId: string | null) => {
    const created = await mediaService.createFolder(name, parentId);
    setFolders((prev) => [
      { id: created.id, name: created.name, parentId, imageCount: 0, createdAt: "" },
      ...prev,
    ]);
    return created;
  }, []);

  const deleteFolder = useCallback(
    async (id: string) => {
      await mediaService.deleteFolder(id);
      // The server cascades to subfolders — refetch to drop the whole subtree.
      const fresh = await mediaService.listFolders();
      setFolders(fresh);
      if (!fresh.some((f) => f.id === currentFolderId)) openFolder(null);
    },
    [currentFolderId, openFolder],
  );

  return {
    images,
    folders,
    currentFolderId,
    loading,
    error,
    uploading,
    refetch,
    openFolder,
    upload,
    remove,
    createFolder,
    deleteFolder,
  };
}
