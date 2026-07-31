import { PermissionsEnum } from '@modules/permissions/enums/permissions.enum';

export interface PermissionSeed {
  resource: string;
  actions: PermissionsEnum[];
}

export const PERMISSIONS_SEED: PermissionSeed[] = [
  { resource: 'users', actions: [PermissionsEnum.CREATE] },
  { resource: 'users', actions: [PermissionsEnum.READ] },
  { resource: 'users', actions: [PermissionsEnum.UPDATE] },
  { resource: 'users', actions: [PermissionsEnum.DELETE] },
  {
    resource: 'users',
    actions: [PermissionsEnum.CREATE, PermissionsEnum.READ, PermissionsEnum.UPDATE],
  },
  {
    resource: 'users',
    actions: [
      PermissionsEnum.CREATE,
      PermissionsEnum.READ,
      PermissionsEnum.UPDATE,
      PermissionsEnum.DELETE,
    ],
  },
  { resource: 'roles', actions: [PermissionsEnum.CREATE] },
  { resource: 'roles', actions: [PermissionsEnum.READ] },
  { resource: 'roles', actions: [PermissionsEnum.UPDATE] },
  { resource: 'roles', actions: [PermissionsEnum.DELETE] },
  {
    resource: 'roles',
    actions: [
      PermissionsEnum.CREATE,
      PermissionsEnum.READ,
      PermissionsEnum.UPDATE,
      PermissionsEnum.DELETE,
    ],
  },
  { resource: 'permissions', actions: [PermissionsEnum.CREATE] },
  { resource: 'permissions', actions: [PermissionsEnum.READ] },
  { resource: 'permissions', actions: [PermissionsEnum.UPDATE] },
  { resource: 'permissions', actions: [PermissionsEnum.DELETE] },
  {
    resource: 'permissions',
    actions: [
      PermissionsEnum.CREATE,
      PermissionsEnum.READ,
      PermissionsEnum.UPDATE,
      PermissionsEnum.DELETE,
    ],
  },
];
