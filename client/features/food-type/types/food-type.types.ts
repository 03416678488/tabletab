export interface FoodType {
  id: string;
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

export interface CreateFoodTypeInput {
  branchId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateFoodTypeInput = Partial<CreateFoodTypeInput>;

export interface ListFoodTypesParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
  branchId?: string;
}
