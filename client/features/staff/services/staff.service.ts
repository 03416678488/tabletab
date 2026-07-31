import { httpClient } from "@/lib/httpClient";
import { STAFF_ENDPOINTS } from "@/features/staff/constants/staff.constants";
import type {
  CreateStaffInput,
  ListStaffParams,
  Paginated,
  Staff,
  UpdateStaffInput,
} from "@/features/staff/types/staff.types";

/**
 * Staff API client. All calls go through the shared httpClient with
 * `auth: true`, which attaches the NextAuth access token.
 */
export const staffService = {
  list(params?: ListStaffParams) {
    return httpClient
      .get<Paginated<Staff>>(STAFF_ENDPOINTS.base, {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          role: params?.role,
          branchId: params?.branchId,
          isActive: params?.isActive,
        },
      })
      .then((res) => res.data);
  },

  getById(id: string) {
    return httpClient
      .get<Staff>(STAFF_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },

  create(body: CreateStaffInput) {
    return httpClient
      .post<Staff>(STAFF_ENDPOINTS.base, body, { auth: true })
      .then((res) => res.data);
  },

  update(id: string, body: UpdateStaffInput) {
    return httpClient
      .put<Staff>(STAFF_ENDPOINTS.byId(id), body, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(STAFF_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },
};
