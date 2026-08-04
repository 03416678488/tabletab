export const MEDIA_ENDPOINTS = {
  images: "/file-manager/images",
  uploadImage: "/file-manager/upload-image",
  byId: (id: string) => `/file-manager/${id}`,
  folders: "/file-manager/folders",
  folderById: (id: string) => `/file-manager/folders/${id}`,
} as const;
