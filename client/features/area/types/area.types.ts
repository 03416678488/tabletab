export interface Area {
  id: string;
  name: string;
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

export interface CreateAreaInput {
  name: string;
  branchId?: string;
}

export type UpdateAreaInput = Partial<CreateAreaInput>;

export interface ListAreasParams {
  page?: number;
  perPage?: number;
  search?: string;
  branchId?: string;
}
