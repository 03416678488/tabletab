/** An uploaded file as returned by the file-manager API. */
export interface MediaFile {
  id: string;
  fileName: string;
  originalFileName: string;
  mimetype: string;
  size: number;
  /** Folder this image belongs to (null = root/uncategorised). */
  folderId: string | null;
  /** Absolute, ready-to-use URL (served from the API's public dir). */
  url: string;
}

/** A folder that groups a user's uploaded images. Nestable via `parentId`. */
export interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  imageCount: number;
  createdAt: string;
}
