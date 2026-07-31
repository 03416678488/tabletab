import { create } from "zustand";
import { persist } from "zustand/middleware";
import { categories as initialCategories, menuItems as initialItems } from "@/lib/mock/menu";
import type { MenuCategory, MenuItem, MenuTag } from "@/lib/types";

export interface MenuItemInput {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  tags: MenuTag[];
  imageUrl: string;
  model3dUrl?: string;
  isAvailable: boolean;
}

interface MenuStore {
  categories: MenuCategory[];
  items: MenuItem[];
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  addCategory: (name: string, description?: string) => MenuCategory;
  updateCategory: (id: string, patch: Partial<Pick<MenuCategory, "name" | "description">>) => void;
  reorderCategory: (id: string, direction: "up" | "down") => void;
  addItem: (input: MenuItemInput) => MenuItem;
  updateItem: (id: string, input: MenuItemInput) => void;
  toggleItemAvailability: (id: string) => void;
  deleteItem: (id: string) => void;
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useMenuStore = create<MenuStore>()(
  persist(
    (set, get) => ({
      categories: initialCategories,
      items: initialItems,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      addCategory: (name, description) => {
        const maxOrder = Math.max(0, ...get().categories.map((c) => c.sortOrder));
        const cat: MenuCategory = {
          id: newId("cat"),
          name: name.trim(),
          description: description?.trim(),
          sortOrder: maxOrder + 1,
        };
        set({ categories: [...get().categories, cat] });
        return cat;
      },

      updateCategory: (id, patch) => {
        set({
          categories: get().categories.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        });
      },

      reorderCategory: (id, direction) => {
        const sorted = [...get().categories].sort((a, b) => a.sortOrder - b.sortOrder);
        const idx = sorted.findIndex((c) => c.id === id);
        if (idx < 0) return;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return;
        const a = sorted[idx];
        const b = sorted[swapIdx];
        const orderA = a.sortOrder;
        sorted[idx] = { ...b, sortOrder: orderA };
        sorted[swapIdx] = { ...a, sortOrder: b.sortOrder };
        set({ categories: sorted });
      },

      addItem: (input) => {
        const model3dUrl = input.model3dUrl?.trim() || undefined;
        const item: MenuItem = {
          id: newId("itm"),
          categoryId: input.categoryId,
          name: input.name.trim(),
          description: input.description.trim(),
          price: input.price,
          imageUrl: input.imageUrl.trim(),
          model3dUrl,
          tags: input.tags,
          modifiers: [],
          isAvailable: input.isAvailable,
        };
        set({ items: [...get().items, item] });
        return item;
      },

      updateItem: (id, input) => {
        set({
          items: get().items.map((it) =>
            it.id === id
              ? {
                  ...it,
                  categoryId: input.categoryId,
                  name: input.name.trim(),
                  description: input.description.trim(),
                  price: input.price,
                  imageUrl: input.imageUrl.trim(),
                  model3dUrl: input.model3dUrl?.trim() || undefined,
                  tags: input.tags,
                  isAvailable: input.isAvailable,
                }
              : it,
          ),
        });
      },

      toggleItemAvailability: (id) => {
        set({
          items: get().items.map((it) =>
            it.id === id ? { ...it, isAvailable: !it.isAvailable } : it,
          ),
        });
      },

      deleteItem: (id) => {
        set({ items: get().items.filter((it) => it.id !== id) });
      },
    }),
    {
      name: "tabletap-menu-admin",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

/** Snapshot for lib/api.ts (no React hook). */
export function getMenuSnapshot() {
  return useMenuStore.getState();
}
