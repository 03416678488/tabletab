export type PermissionAction = "create" | "read" | "update" | "delete";

export interface RoleRef {
  id: number;
  name: string;
}

export interface ModuleRef {
  key: string;
  label: string;
  group: string;
}

/** grants[roleId][resource] = actions[] */
export type Grants = Record<number, Record<string, PermissionAction[]>>;

export interface AccessMatrix {
  roles: RoleRef[];
  modules: ModuleRef[];
  actions: PermissionAction[];
  grants: Grants;
}

/** The signed-in user's effective permissions (from /role-permissions/me). */
export interface MyAccess {
  isSuperAdmin: boolean;
  grants: Record<string, PermissionAction[]>;
}
