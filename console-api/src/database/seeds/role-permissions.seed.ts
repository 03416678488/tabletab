import { PermissionsEnum } from '@modules/permissions/enums/permissions.enum';

export interface RolePermissionMapping {
  resource: string;
  actions: PermissionsEnum[];
}

const CRUD: PermissionsEnum[] = [
  PermissionsEnum.CREATE,
  PermissionsEnum.READ,
  PermissionsEnum.UPDATE,
  PermissionsEnum.DELETE,
];
const R: PermissionsEnum[] = [PermissionsEnum.READ];

/** Neutral row every role gets so its users link to the role (dropped from real grants). */
const ANCHOR: RolePermissionMapping = { resource: 'app', actions: R };

const ALL_MODULES = [
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
 * Default module grants per role. Feeds BOTH the role→permission link table and
 * the role-scoped `role_permissions` (admins can retune anytime in the UI).
 */
export const ROLE_PERMISSIONS_SEED: Record<string, RolePermissionMapping[]> = {
  'Super Admin': [ANCHOR, ...ALL_MODULES.map((resource) => ({ resource, actions: CRUD }))],
  Admin: [ANCHOR, ...ALL_MODULES.map((resource) => ({ resource, actions: CRUD }))],

  Administrators: [ANCHOR, ...ALL_MODULES.map((resource) => ({ resource, actions: CRUD }))],

  Employees: [
    ANCHOR,
    { resource: 'dashboard', actions: R },
    { resource: 'orders', actions: CRUD },
    { resource: 'pos', actions: CRUD },
    { resource: 'kds', actions: R },
    { resource: 'menu', actions: CRUD },
    { resource: 'categories', actions: CRUD },
    { resource: 'tables', actions: CRUD },
    { resource: 'areas', actions: CRUD },
    { resource: 'qr-codes', actions: CRUD },
    { resource: 'customers', actions: CRUD },
    { resource: 'branches', actions: R },
    { resource: 'reports', actions: R },
  ],

  Waiters: [
    ANCHOR,
    { resource: 'dashboard', actions: R },
    { resource: 'pos', actions: CRUD },
    { resource: 'orders', actions: CRUD },
    { resource: 'tables', actions: R },
    { resource: 'kds', actions: R },
    { resource: 'customers', actions: CRUD },
  ],

  Chefs: [
    ANCHOR,
    { resource: 'dashboard', actions: R },
    { resource: 'kds', actions: CRUD },
    { resource: 'orders', actions: R },
    { resource: 'menu', actions: R },
  ],

  'Delivery Boys': [
    ANCHOR,
    { resource: 'dashboard', actions: R },
    { resource: 'orders', actions: CRUD },
    { resource: 'oss', actions: R },
  ],

  // Customers are guests — no dashboard modules, just the link anchor.
  Customers: [ANCHOR],
};
