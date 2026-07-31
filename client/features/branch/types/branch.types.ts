/** Branch as returned by the API (`data` of /branches endpoints). */
export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  imageUrl: string | null;
  isOpen: boolean;
  lat: number | null;
  lng: number | null;
  openingHours: string | null;
  deliveryFee: number | null;
  minOrder: number | null;
  onlineOrderingEnabled: boolean;
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

export interface CreateBranchInput {
  name: string;
  address: string;
  city: string;
  phone: string;
  imageUrl?: string;
  isOpen?: boolean;
  lat?: number;
  lng?: number;
  openingHours?: string;
  deliveryFee?: number;
  minOrder?: number;
  onlineOrderingEnabled?: boolean;
}

export type UpdateBranchInput = Partial<CreateBranchInput>;

export interface ListBranchesParams {
  page?: number;
  perPage?: number;
  name?: string;
  city?: string;
  isOpen?: boolean;
}
