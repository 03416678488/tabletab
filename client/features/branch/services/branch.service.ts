import { httpClient } from "@/lib/httpClient";
import { BRANCH_ENDPOINTS } from "@/features/branch/constants/branch.constants";
import type {
  Branch,
  CreateBranchInput,
  ListBranchesParams,
  Paginated,
  UpdateBranchInput,
} from "@/features/branch/types/branch.types";

/**
 * Branch API client. All calls go through the shared httpClient with
 * `auth: true`, which attaches the NextAuth access token.
 */
export const branchService = {
  list(params?: ListBranchesParams) {
    return httpClient
      .get<Paginated<Branch>>(BRANCH_ENDPOINTS.base, {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          name: params?.name,
          city: params?.city,
          isOpen: params?.isOpen,
        },
      })
      .then((res) => res.data);
  },

  getById(id: string) {
    return httpClient
      .get<Branch>(BRANCH_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },

  create(body: CreateBranchInput) {
    return httpClient
      .post<Branch>(BRANCH_ENDPOINTS.base, body, { auth: true })
      .then((res) => res.data);
  },

  update(id: string, body: UpdateBranchInput) {
    return httpClient
      .put<Branch>(BRANCH_ENDPOINTS.byId(id), body, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(BRANCH_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },
};
