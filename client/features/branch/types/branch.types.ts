import type { WeeklyHours } from "@/lib/opening-hours";

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
  /** Per-day weekly hours, or null to inherit the global opening times. */
  openingHours: WeeklyHours | null;
  deliveryFee: number | null;
  minOrder: number | null;
  onlineOrderingEnabled: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryEtaMinutes: number | null;
  reservationsEnabled: boolean;
  reservationTurnMins: number;
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
  openingHours?: WeeklyHours | null;
  deliveryFee?: number;
  minOrder?: number;
  onlineOrderingEnabled?: boolean;
  deliveryEnabled?: boolean;
  pickupEnabled?: boolean;
  deliveryEtaMinutes?: number;
  reservationsEnabled?: boolean;
  reservationTurnMins?: number;
}

export type UpdateBranchInput = Partial<CreateBranchInput>;

export interface ListBranchesParams {
  page?: number;
  perPage?: number;
  name?: string;
  city?: string;
  isOpen?: boolean;
}
