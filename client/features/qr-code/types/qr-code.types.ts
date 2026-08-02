export interface QrTableRef {
  id: string;
  name: string;
  area?: { id: string; name: string } | null;
  branch?: { id: string; name: string } | null;
}

/** A table QR code as returned by the API (`data` of /qr-codes endpoints). */
export interface QrCode {
  id: string;
  slug: string;
  isActive: boolean;
  tableId: string;
  table?: QrTableRef | null;
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

export interface CreateQrCodeInput {
  tableId: string;
  isActive?: boolean;
}

export type UpdateQrCodeInput = Partial<CreateQrCodeInput>;

export interface ListQrCodesParams {
  page?: number;
  perPage?: number;
  search?: string;
  tableId?: string;
  areaId?: string;
  branchId?: string;
  isActive?: boolean;
}
