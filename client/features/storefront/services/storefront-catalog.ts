import { httpClient } from "@/lib/httpClient";
import type { MenuCategory, MenuItem } from "@/lib/types";

interface ApiMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: string | null;
  isAvailable: boolean;
  foodTypes?: { name: string }[];
}

interface ApiCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

function unwrap<T>(data: { items?: T[] } | T[]): T[] {
  return Array.isArray(data) ? data : (data.items ?? []);
}

function toMenuItem(i: ApiMenuItem): MenuItem {
  return {
    id: i.id,
    categoryId: i.categoryId ?? "",
    name: i.name,
    description: i.description ?? "",
    price: i.price,
    imageUrl: i.imageUrl ?? "",
    // Diet tags come from the item's food types (used by the menu filters).
    tags: (i.foodTypes ?? []).map((f) => f.name.toLowerCase()) as MenuItem["tags"],
    modifiers: [],
    isAvailable: i.isAvailable,
  };
}

/** All available products for the storefront menu (single flat fetch, capped). */
export async function fetchStorefrontProducts(): Promise<MenuItem[]> {
  const res = await httpClient.get<{ items?: ApiMenuItem[] } | ApiMenuItem[]>("/menu-items", {
    params: { perPage: 200 },
  });
  return unwrap(res.data)
    .filter((i) => i.isAvailable !== false)
    .map(toMenuItem);
}

interface ApiPaginated<T> {
  items: T[];
  meta: { totalItems: number; totalPages: number; currentPage: number; itemsPerPage: number };
}

export interface CatalogPage {
  items: MenuItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

/**
 * One page of available products, filtered server-side by search/category so the
 * storefront scales past the flat 200 cap (used by the infinite-scroll catalog).
 * `isAvailable: "true"` hides sold-out items and keeps the paging counts exact.
 */
export async function fetchStorefrontProductsPage(params: {
  page: number;
  perPage?: number;
  search?: string;
  /** Multi-category filter (server-side `IN`). */
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
}): Promise<CatalogPage> {
  const { page, perPage = 48, search, categoryIds, minPrice, maxPrice } = params;
  const res = await httpClient.get<ApiPaginated<ApiMenuItem>>("/menu-items", {
    params: {
      page,
      perPage,
      isAvailable: "true",
      ...(search?.trim() ? { search: search.trim() } : {}),
      ...(categoryIds && categoryIds.length ? { categoryIds: categoryIds.join(",") } : {}),
      ...(minPrice != null ? { minPrice } : {}),
      ...(maxPrice != null ? { maxPrice } : {}),
    },
  });
  const data = res.data;
  return {
    items: (data.items ?? []).map(toMenuItem),
    totalItems: data.meta?.totalItems ?? 0,
    totalPages: data.meta?.totalPages ?? 1,
    currentPage: data.meta?.currentPage ?? page,
  };
}

/** Menu categories (for grouping/filtering the storefront menu). */
export async function fetchStorefrontCategories(): Promise<MenuCategory[]> {
  const res = await httpClient.get<{ items?: ApiCategory[] } | ApiCategory[]>("/categories", {
    params: { perPage: 100 },
  });
  return unwrap(res.data)
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? undefined,
      sortOrder: c.sortOrder,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
