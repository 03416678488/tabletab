import { PermissionsEnum } from '@modules/permissions/enums/permissions.enum';

export interface RolePermissionMapping {
  resource: string;
  actions: PermissionsEnum[];
}

export const ROLE_PERMISSIONS_SEED: Record<string, RolePermissionMapping[]> = {
  'Super Admin': [
    {
      resource: 'users',
      actions: [
        PermissionsEnum.CREATE,
        PermissionsEnum.READ,
        PermissionsEnum.UPDATE,
        PermissionsEnum.DELETE,
      ],
    },
    {
      resource: 'roles',
      actions: [
        PermissionsEnum.CREATE,
        PermissionsEnum.READ,
        PermissionsEnum.UPDATE,
        PermissionsEnum.DELETE,
      ],
    },
    {
      resource: 'permissions',
      actions: [
        PermissionsEnum.CREATE,
        PermissionsEnum.READ,
        PermissionsEnum.UPDATE,
        PermissionsEnum.DELETE,
      ],
    },
  ],
  Admin: [
    {
      resource: 'users',
      actions: [
        PermissionsEnum.CREATE,
        PermissionsEnum.READ,
        PermissionsEnum.UPDATE,
        PermissionsEnum.DELETE,
      ],
    },
    { resource: 'roles', actions: [PermissionsEnum.READ] },
    { resource: 'permissions', actions: [PermissionsEnum.READ] },
  ],
  Manager: [
    {
      resource: 'users',
      actions: [PermissionsEnum.CREATE, PermissionsEnum.READ, PermissionsEnum.UPDATE],
    },
    { resource: 'roles', actions: [PermissionsEnum.READ] },
    { resource: 'permissions', actions: [PermissionsEnum.READ] },
  ],
  User: [
    { resource: 'users', actions: [PermissionsEnum.READ] },
    { resource: 'roles', actions: [PermissionsEnum.READ] },
    { resource: 'permissions', actions: [PermissionsEnum.READ] },
  ],
  Guest: [{ resource: 'users', actions: [PermissionsEnum.READ] }],
};
