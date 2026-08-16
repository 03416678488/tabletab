import { httpClient } from "@/lib/httpClient";
import type { MenuCategory, MenuItem, MenuModifierGroup } from "@/lib/types";

interface ApiOption {
  name: string;
  price: number;
}

/** Loose shape for API modifier groups — field names are normalised on read. */
interface ApiModifierOption {
  id?: string;
  label?: string;
  name?: string;
  priceDelta?: number;
  price?: number;
}
interface ApiModifierGroup {
  id?: string;
  label?: string;
  name?: string;
  required?: boolean;
  multiple?: boolean;
  options?: ApiModifierOption[];
}

interface ApiMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  images?: string[] | null;
  // Items are global; each carries per-branch categories (categoryId was dropped).
  categories?: { id: string; branchId?: string | null }[] | null;
  isAvailable: boolean;
  foodTypes?: { name: string }[];
  sizes?: ApiOption[] | null;
  variants?: ApiOption[] | null;
  addOns?: ApiOption[] | null;
  // The backend doesn't model modifier groups yet (customisation is
  // sizes/variants/add-ons). We accept either key so they flow through the day
  // the API adds them — no further client change needed.
  modifiers?: ApiModifierGroup[] | null;
  modifierGroups?: ApiModifierGroup[] | null;
}

/** Normalise API modifier groups to the frontend `MenuModifierGroup` shape. */
function toModifiers(raw?: ApiModifierGroup[] | null): MenuModifierGroup[] {
  return (raw ?? []).map((g, gi) => ({
    id: g.id ?? `mg-${gi}`,
    label: g.label ?? g.name ?? "Options",
    required: Boolean(g.required),
    multiple: Boolean(g.multiple),
    options: (g.options ?? []).map((o, oi) => ({
      id: o.id ?? `mo-${gi}-${oi}`,
      label: o.label ?? o.name ?? "",
      priceDelta: o.priceDelta ?? o.price ?? 0,
    })),
  }));
}

interface ApiCategory {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

function unwrap<T>(data: { items?: T[] } | T[]): T[] {
  return Array.isArray(data) ? data : (data.items ?? []);
}

/** The item's category id for the fetched branch (categories are per-branch). */
function pickCategoryId(cats: ApiMenuItem["categories"], branchId?: string | null): string {
  if (!cats?.length) return "";
  const inBranch = branchId ? cats.find((c) => c.branchId === branchId) : undefined;
  return (inBranch ?? cats[0]).id;
}

function toMenuItem(i: ApiMenuItem, branchId?: string | null): MenuItem {
  return {
    id: i.id,
    categoryId: pickCategoryId(i.categories, branchId),
    name: i.name,
    description: i.description ?? "",
    price: i.price,
    imageUrl: i.imageUrl ?? "",
    images: (i.images ?? []).filter(Boolean),
    // Diet tags come from the item's food types (used by the menu filters).
    tags: (i.foodTypes ?? []).map((f) => f.name.toLowerCase()) as MenuItem["tags"],
    modifiers: toModifiers(i.modifiers ?? i.modifierGroups),
    sizes: i.sizes ?? [],
    variants: i.variants ?? [],
    addOns: i.addOns ?? [],
    isAvailable: i.isAvailable,
  };
}

/** All available products for the storefront menu (single flat fetch, capped). */
export async function fetchStorefrontProducts(branchId?: string | null): Promise<MenuItem[]> {
  const res = await httpClient.get<{ items?: ApiMenuItem[] } | ApiMenuItem[]>("/menu-items", {
    params: { perPage: 200, branchId: branchId ?? undefined },
  });
  return unwrap(res.data)
    .filter((i) => i.isAvailable !== false)
    .map((i) => toMenuItem(i, branchId));
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
  branchId?: string | null;
}): Promise<CatalogPage> {
  const { page, perPage = 48, search, categoryIds, minPrice, maxPrice, branchId } = params;
  const res = await httpClient.get<ApiPaginated<ApiMenuItem>>("/menu-items", {
    params: {
      page,
      perPage,
      isAvailable: "true",
      ...(search?.trim() ? { search: search.trim() } : {}),
      ...(categoryIds && categoryIds.length ? { categoryIds: categoryIds.join(",") } : {}),
      ...(minPrice != null ? { minPrice } : {}),
      ...(maxPrice != null ? { maxPrice } : {}),
      ...(branchId ? { branchId } : {}),
    },
  });
  const data = res.data;
  return {
    items: (data.items ?? []).map((i) => toMenuItem(i, branchId)),
    totalItems: data.meta?.totalItems ?? 0,
    totalPages: data.meta?.totalPages ?? 1,
    currentPage: data.meta?.currentPage ?? page,
  };
}

/** Menu categories (for grouping/filtering the storefront menu). */
export async function fetchStorefrontCategories(branchId?: string | null): Promise<MenuCategory[]> {
  const res = await httpClient.get<{ items?: ApiCategory[] } | ApiCategory[]>("/categories", {
    params: { perPage: 100, branchId: branchId ?? undefined },
  });
  return unwrap(res.data)
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? undefined,
      imageUrl: c.imageUrl ?? undefined,
      sortOrder: c.sortOrder,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
