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
  /** Per-branch categories this global item is placed into (membership). */
  categories?: RefName[];
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
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  isAvailable?: boolean;
  /** Per-branch categories to place this item in. */
  categoryIds?: string[];
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
  categoryIds?: string;
  isAvailable?: boolean;
  /** "Carried at this branch" — items in one of the branch's categories. */
  branchId?: string;
}
