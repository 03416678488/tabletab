import { httpClient } from "@/lib/httpClient";
import { APP_USER_ENDPOINTS } from "@/features/app-user/constants/app-user.constants";
import type {
  AppUser,
  CreateUserInput,
  ListUsersParams,
  UpdateUserInput,
} from "@/features/app-user/types/app-user.types";

export const appUserService = {
  list(params?: ListUsersParams) {
    return httpClient
      .get<AppUser[]>(APP_USER_ENDPOINTS.list, {
        auth: true,
        params: { role: params?.role, search: params?.search },
      })
      .then((res) => res.data);
  },

  create(input: CreateUserInput) {
    return httpClient.post<AppUser>("/user", input, { auth: true }).then((res) => res.data);
  },

  update(id: string, input: UpdateUserInput) {
    return httpClient
      .patch<{ success: true }>(`/user/${id}`, input, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ success: true }>(`/user/${id}`, { auth: true })
      .then((res) => res.data);
  },

  setBranch(id: string, branchId: string | null) {
    return httpClient
      .patch<{ success: true }>(`/user/${id}/branch`, { branchId }, { auth: true })
      .then((res) => res.data);
  },
};
