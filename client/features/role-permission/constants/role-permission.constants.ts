import type { PermissionAction } from "@/features/role-permission/types/role-permission.types";

export const ROLE_PERMISSION_ENDPOINTS = {
  matrix: "/role-permissions/matrix",
  me: "/role-permissions/me",
  byRole: (roleId: number) => `/role-permissions/${roleId}`,
} as const;

export const ACTION_LABELS: Record<PermissionAction, string> = {
  create: "Add",
  read: "View",
  update: "Update",
  delete: "Delete",
};
