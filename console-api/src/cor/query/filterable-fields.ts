export type FilterableFields<T> = ReadonlyArray<keyof T>;

export interface QueryConfig<T> {
  filterableFields: FilterableFields<T>;
  searchableFields: FilterableFields<T>;
  defaultSort?: {
    field: keyof T;
    order: 'ASC' | 'DESC';
  };
}
