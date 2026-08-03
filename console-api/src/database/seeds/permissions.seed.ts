import { PermissionsEnum } from '@modules/permissions/enums/permissions.enum';

export interface PermissionSeed {
  resource: string;
  actions: PermissionsEnum[];
}

const CRUD: PermissionsEnum[] = [
  PermissionsEnum.CREATE,
  PermissionsEnum.READ,
  PermissionsEnum.UPDATE,
  PermissionsEnum.DELETE,
];
const READ: PermissionsEnum[] = [PermissionsEnum.READ];

/** App modules an admin can grant per role (mirrors the role-permission catalog). */
export const MODULE_RESOURCES = [
  'dashboard',
  'orders',
  'pos',
  'kds',
  'oss',
  'menu',
  'categories',
  'tables',
  'areas',
  'qr-codes',
  'branches',
  'users',
  'customers',
  'reports',
  'settings',
];

/**
 * A full-CRUD row and a read-only row per module, plus a neutral `app` anchor
 * used only to link a user to a role (it is not a real, grantable module).
 */
export const PERMISSIONS_SEED: PermissionSeed[] = [
  { resource: 'app', actions: READ },
  ...MODULE_RESOURCES.flatMap((resource) => [
    { resource, actions: CRUD },
    { resource, actions: READ },
  ]),
];
