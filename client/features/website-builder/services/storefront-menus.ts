import { httpClient } from "@/lib/httpClient";
import type { MenuItem } from "@/lib/types";

/** A named menu with the available dishes assigned to it. */
export interface StorefrontMenu {
  id: string;
  name: string;
  imageUrl: string;
  sortOrder: number;
  items: MenuItem[];
}

interface ApiMenu {
  id: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface ApiMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  // Items are global; each carries per-branch categories (categoryId was dropped).
  categories?: { id: string }[] | null;
  isAvailable: boolean;
  menus?: { id: string }[];
}

function unwrap<T>(data: { items?: T[] } | T[]): T[] {
  return Array.isArray(data) ? data : (data.items ?? []);
}

/** Active menus as `{ value, label }` options for the builder's menu picker. */
export async function fetchMenuOptions(): Promise<{ value: string; label: string }[]> {
  const res = await httpClient.get<{ items?: ApiMenu[] } | ApiMenu[]>("/menus", {
    params: { perPage: 100 },
  });
  return unwrap(res.data)
    .filter((m) => m.isActive !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((m) => ({ value: m.id, label: m.name }));
}

/** All available products (menu items) for the storefront. */
export async function fetchStorefrontProducts(): Promise<MenuItem[]> {
  const res = await httpClient.get<{ items?: ApiMenuItem[] } | ApiMenuItem[]>("/menu-items", {
    params: { perPage: 100 },
  });
  return unwrap(res.data)
    .filter((i) => i.isAvailable !== false)
    .map(toMenuItem);
}

/** All products as `{ value, label }` options for the builder's product picker. */
export async function fetchProductOptions(): Promise<{ value: string; label: string }[]> {
  const res = await httpClient.get<{ items?: ApiMenuItem[] } | ApiMenuItem[]>("/menu-items", {
    params: { perPage: 100 },
  });
  return unwrap(res.data).map((i) => ({ value: i.id, label: i.name }));
}

function toMenuItem(i: ApiMenuItem): MenuItem {
  return {
    id: i.id,
    categoryId: i.categories?.[0]?.id ?? "",
    name: i.name,
    description: i.description ?? "",
    price: i.price,
    imageUrl: i.imageUrl ?? "",
    tags: [],
    modifiers: [],
    isAvailable: i.isAvailable,
  };
}

/**
 * Public storefront data for the "Menu grid" block: every active menu paired
 * with the available dishes assigned to it, ordered by the menu's sortOrder.
 */
export async function fetchStorefrontMenus(): Promise<StorefrontMenu[]> {
  const [menusRes, itemsRes] = await Promise.all([
    httpClient.get<{ items?: ApiMenu[] } | ApiMenu[]>("/menus", { params: { perPage: 100 } }),
    httpClient.get<{ items?: ApiMenuItem[] } | ApiMenuItem[]>("/menu-items", {
      params: { perPage: 100 },
    }),
  ]);

  // Bucket each available dish under every menu it belongs to.
  const byMenu = new Map<string, MenuItem[]>();
  for (const raw of unwrap(itemsRes.data)) {
    if (raw.isAvailable === false) continue;
    for (const m of raw.menus ?? []) {
      const list = byMenu.get(m.id) ?? [];
      list.push(toMenuItem(raw));
      byMenu.set(m.id, list);
    }
  }

  return unwrap(menusRes.data)
    .filter((m) => m.isActive !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((m) => ({
      id: m.id,
      name: m.name,
      imageUrl: m.imageUrl ?? "",
      sortOrder: m.sortOrder,
      items: byMenu.get(m.id) ?? [],
    }));
}
