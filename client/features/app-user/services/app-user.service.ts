import { httpClient } from "@/lib/httpClient";
import { APP_USER_ENDPOINTS } from "@/features/app-user/constants/app-user.constants";
import type { AppUser, ListUsersParams } from "@/features/app-user/types/app-user.types";

export const appUserService = {
  list(params?: ListUsersParams) {
    return httpClient
      .get<AppUser[]>(APP_USER_ENDPOINTS.list, {
        auth: true,
        params: { role: params?.role, search: params?.search },
      })
      .then((res) => res.data);
  },
};
