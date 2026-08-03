import { httpClient } from "@/lib/httpClient";
import { MEDIA_ENDPOINTS } from "@/features/media/constants/media.constants";
import type { MediaFile, MediaFolder } from "@/features/media/types/media.types";

export const mediaService = {
  /** Images in a folder, or root (uncategorised) images when no folder given. */
  listImages(folderId?: string | null) {
    return httpClient
      .get<MediaFile[]>(MEDIA_ENDPOINTS.images, {
        auth: true,
        params: folderId ? { folderId } : undefined,
      })
      .then((res) => res.data);
  },

  uploadImage(file: File, folderId?: string | null) {
    const formData = new FormData();
    formData.append("file", file);
    return httpClient
      .post<MediaFile>(MEDIA_ENDPOINTS.uploadImage, formData, {
        auth: true,
        params: folderId ? { folderId } : undefined,
      })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(MEDIA_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },

  // ── Folders ──
  listFolders() {
    return httpClient
      .get<MediaFolder[]>(MEDIA_ENDPOINTS.folders, { auth: true })
      .then((res) => res.data);
  },

  createFolder(name: string, parentId?: string | null) {
    return httpClient
      .post<MediaFolder>(MEDIA_ENDPOINTS.folders, { name, parentId: parentId ?? null }, { auth: true })
      .then((res) => res.data);
  },

  deleteFolder(id: string) {
    return httpClient
      .delete<{ message: string }>(MEDIA_ENDPOINTS.folderById(id), { auth: true })
      .then((res) => res.data);
  },
};
