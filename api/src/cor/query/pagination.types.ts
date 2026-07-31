export interface ListQueryOptions {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  q?: string;
}

export interface QueryConfig<T> {
  filterableFields: ReadonlyArray<keyof T>;
  searchableFields: ReadonlyArray<keyof T>;
  defaultSort?: { field: keyof T; order: 'ASC' | 'DESC' };
}
