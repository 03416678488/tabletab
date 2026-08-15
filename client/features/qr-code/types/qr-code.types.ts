export interface QrTableRef {
  id: string;
  name: string;
  area?: { id: string; name: string } | null;
  branch?: { id: string; name: string } | null;
}

export type QrCodeKind = "table" | "custom";
export type QrCustomType = "url" | "review" | "wifi" | "text" | "phone" | "email";

/** A QR code as returned by the API (`data` of /qr-codes endpoints). */
export interface QrCode {
  id: string;
  slug: string;
  isActive: boolean;
  kind: QrCodeKind;
  /** Owning branch — set on custom codes; table codes derive branch from table. */
  branchId?: string | null;
  /** Table codes only. */
  tableId: string | null;
  table?: QrTableRef | null;
  /** Custom codes only. */
  label?: string | null;
  customType?: QrCustomType | null;
  content?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
  links: Record<string, string>;
}

export interface CreateTableQrCodeInput {
  kind?: "table";
  tableId: string;
  isActive?: boolean;
}

export interface CreateCustomQrCodeInput {
  kind: "custom";
  label: string;
  customType: QrCustomType;
  content: string;
  branchId?: string;
  isActive?: boolean;
}

export type CreateQrCodeInput = CreateTableQrCodeInput | CreateCustomQrCodeInput;

export interface UpdateQrCodeInput {
  isActive?: boolean;
  label?: string;
  customType?: QrCustomType;
  content?: string;
}

export interface ListQrCodesParams {
  page?: number;
  perPage?: number;
  search?: string;
  tableId?: string;
  areaId?: string;
  branchId?: string;
  isActive?: boolean;
}
