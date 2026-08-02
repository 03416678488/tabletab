import { httpClient } from "@/lib/httpClient";
import { ROLE_PERMISSION_ENDPOINTS } from "@/features/role-permission/constants/role-permission.constants";
import type {
  AccessMatrix,
  MyAccess,
  PermissionAction,
} from "@/features/role-permission/types/role-permission.types";

export const rolePermissionService = {
  matrix() {
    return httpClient
      .get<AccessMatrix>(ROLE_PERMISSION_ENDPOINTS.matrix, { auth: true })
      .then((res) => res.data);
  },

  me() {
    return httpClient
      .get<MyAccess>(ROLE_PERMISSION_ENDPOINTS.me, { auth: true })
      .then((res) => res.data);
  },

  updateRole(roleId: number, grants: Record<string, PermissionAction[]>) {
    return httpClient
      .put<Record<string, PermissionAction[]>>(
        ROLE_PERMISSION_ENDPOINTS.byRole(roleId),
        { grants },
        { auth: true },
      )
      .then((res) => res.data);
  },
};
