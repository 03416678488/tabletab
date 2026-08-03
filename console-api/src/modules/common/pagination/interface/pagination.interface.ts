export interface Paginated<T> {
  items: T[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
  links: {
    first: string;
    last: string;
    current: string;
    prev: string;
    next: string;
  };
}

/**
 * Shape of the query-string conditions consumed by PaginationFilters.
 * (Was previously imported from a non-existent @modules/contact/types.)
 */
export interface QueryParamConditions {
  id?: string;
  name?: string;
  email?: string;
  createdAt?: { from?: string | Date; to?: string | Date };
  groups?: string[];
}
