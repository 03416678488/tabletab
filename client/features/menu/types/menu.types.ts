export interface RefName {
  id: string;
  name: string;
}

export interface MenuOptionRow {
  name: string;
  price: number;
}

/** Menu item as returned by the API (`data` of /menu-items endpoints). */
export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  images: string[];
  isAvailable: boolean;
  categoryId: string | null;
  category?: RefName | null;
  foodTypes?: RefName[];
  menus?: RefName[];
  sizes: MenuOptionRow[];
  variants: MenuOptionRow[];
  addOns: MenuOptionRow[];
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

export interface CreateMenuItemInput {
  branchId?: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  isAvailable?: boolean;
  categoryId?: string;
  foodTypeIds?: string[];
  menuIds?: string[];
  sizes?: MenuOptionRow[];
  variants?: MenuOptionRow[];
  addOns?: MenuOptionRow[];
}

export type UpdateMenuItemInput = Partial<CreateMenuItemInput>;

export interface ListMenuItemsParams {
  page?: number;
  perPage?: number;
  search?: string;
  categoryId?: string;
  isAvailable?: boolean;
  branchId?: string;
}
