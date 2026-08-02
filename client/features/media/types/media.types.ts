/** An uploaded file as returned by the file-manager API. */
export interface MediaFile {
  id: string;
  fileName: string;
  originalFileName: string;
  mimetype: string;
  size: number;
  /** Absolute, ready-to-use URL (served from the API's public dir). */
  url: string;
}
