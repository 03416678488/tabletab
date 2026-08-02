export const MEDIA_ENDPOINTS = {
  images: "/file-manager/images",
  uploadImage: "/file-manager/upload-image",
  byId: (id: string) => `/file-manager/${id}`,
} as const;
