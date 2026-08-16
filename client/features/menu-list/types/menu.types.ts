export interface Menu {
  id: string;
  /** Owning branch — menus are per-branch (names repeat across branches). */
  branchId?: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
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

export interface CreateMenuInput {
  branchId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateMenuInput = Partial<CreateMenuInput>;

export interface ListMenusParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
  branchId?: string;
}
