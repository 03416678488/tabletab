export interface TableBranchRef {
  id: string;
  name: string;
}

export interface TableAreaRef {
  id: string;
  name: string;
}

/** A dining table as returned by the API (`data` of /tables endpoints). */
export interface DiningTable {
  id: string;
  name: string;
  areaId: string | null;
  area?: TableAreaRef | null;
  capacity: number;
  isActive: boolean;
  branchId: string | null;
  branch?: TableBranchRef | null;
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

export interface CreateTableInput {
  name: string;
  areaId?: string;
  capacity?: number;
  isActive?: boolean;
  branchId?: string;
}

export type UpdateTableInput = Partial<CreateTableInput>;

export interface ListTablesParams {
  page?: number;
  perPage?: number;
  search?: string;
  branchId?: string;
  isActive?: boolean;
}
