import type { StaffRole } from "@/lib/types";

export interface StaffBranchRef {
  id: string;
  name: string;
}

/** Staff member as returned by the API (`data` of /staff endpoints). */
export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: StaffRole;
  avatarUrl: string | null;
  isActive: boolean;
  branchId: string | null;
  branch?: StaffBranchRef | null;
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

export interface CreateStaffInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: StaffRole;
  avatarUrl?: string;
  isActive?: boolean;
  branchId?: string;
}

export type UpdateStaffInput = Partial<CreateStaffInput>;

export interface ListStaffParams {
  page?: number;
  perPage?: number;
  search?: string;
  role?: StaffRole;
  branchId?: string;
  isActive?: boolean;
}
