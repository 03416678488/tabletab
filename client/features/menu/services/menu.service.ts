import { httpClient } from "@/lib/httpClient";
import { MENU_ENDPOINTS } from "@/features/menu/constants/menu.constants";
import type {
  CreateMenuItemInput,
  ListMenuItemsParams,
  MenuItem,
  Paginated,
  UpdateMenuItemInput,
} from "@/features/menu/types/menu.types";

export const menuService = {
  list(params?: ListMenuItemsParams) {
    return httpClient
      .get<Paginated<MenuItem>>(MENU_ENDPOINTS.base, {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          categoryId: params?.categoryId,
          isAvailable: params?.isAvailable,
          branchId: params?.branchId,
        },
      })
      .then((res) => res.data);
  },

  create(body: CreateMenuItemInput) {
    return httpClient
      .post<MenuItem>(MENU_ENDPOINTS.base, body, { auth: true })
      .then((res) => res.data);
  },

  /** Full item incl. ALL category memberships (the list may be filtered). */
  get(id: string) {
    return httpClient
      .get<MenuItem>(MENU_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },

  update(id: string, body: UpdateMenuItemInput) {
    return httpClient
      .put<MenuItem>(MENU_ENDPOINTS.byId(id), body, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(MENU_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },

  bulkRemove(ids: string[]) {
    return httpClient
      .post<{ deleted: number }>(`${MENU_ENDPOINTS.base}/bulk-delete`, { ids }, { auth: true })
      .then((res) => res.data);
  },

  /** Toggle availability. With `branchId` it 86's per-branch; else the global master. */
  bulkSetAvailability(ids: string[], isAvailable: boolean, branchId?: string) {
    return httpClient
      .post<{ updated: number }>(
        `${MENU_ENDPOINTS.base}/bulk-availability`,
        { ids, isAvailable, ...(branchId ? { branchId } : {}) },
        { auth: true },
      )
      .then((res) => res.data);
  },

  /** Effective availability of one item at every branch. */
  getBranchAvailability(id: string) {
    return httpClient
      .get<{ branchId: string; isAvailable: boolean }[]>(
        `${MENU_ENDPOINTS.byId(id)}/branch-availability`,
        { auth: true },
      )
      .then((res) => res.data);
  },

  bulkSetCategory(ids: string[], categoryId: string) {
    return httpClient
      .post<{ updated: number }>(
        `${MENU_ENDPOINTS.base}/bulk-category`,
        { ids, categoryId },
        { auth: true },
      )
      .then((res) => res.data);
  },

  exportCsv() {
    return httpClient
      .get<{ csv: string; count: number }>(`${MENU_ENDPOINTS.base}/export`, { auth: true })
      .then((res) => res.data);
  },

  importCsv(csv: string) {
    return httpClient
      .post<MenuImportResult>(`${MENU_ENDPOINTS.base}/import`, { csv }, { auth: true })
      .then((res) => res.data);
  },
};

export interface MenuImportResult {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}
