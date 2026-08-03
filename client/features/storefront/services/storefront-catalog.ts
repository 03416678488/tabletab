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

/** All available products for the storefront menu. */
export async function fetchStorefrontProducts(): Promise<MenuItem[]> {
  const res = await httpClient.get<{ items?: ApiMenuItem[] } | ApiMenuItem[]>("/menu-items", {
    params: { perPage: 200 },
  });
  return unwrap(res.data)
    .filter((i) => i.isAvailable !== false)
    .map(toMenuItem);
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
