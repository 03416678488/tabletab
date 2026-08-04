export interface Area {
  id: string;
  name: string;
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
}

export type UpdateAreaInput = Partial<CreateAreaInput>;

export interface ListAreasParams {
  page?: number;
  perPage?: number;
  search?: string;
}
