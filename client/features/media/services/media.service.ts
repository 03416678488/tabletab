import { httpClient } from "@/lib/httpClient";
import { MEDIA_ENDPOINTS } from "@/features/media/constants/media.constants";
import type { MediaFile } from "@/features/media/types/media.types";

export const mediaService = {
  listImages() {
    return httpClient
      .get<MediaFile[]>(MEDIA_ENDPOINTS.images, { auth: true })
      .then((res) => res.data);
  },

  uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return httpClient
      .post<MediaFile>(MEDIA_ENDPOINTS.uploadImage, formData, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(MEDIA_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },
};
