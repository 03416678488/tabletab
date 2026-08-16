export interface Category {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  /** Owning branch (categories are per-branch). */
  branchId: string | null;
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

export interface CreateCategoryInput {
  branchId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export interface ListCategoriesParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
  branchId?: string;
}
