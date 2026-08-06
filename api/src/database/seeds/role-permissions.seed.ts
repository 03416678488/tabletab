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
  // Owner — top admin, full access to every module.
  Owner: [ANCHOR, ...ALL_MODULES.map((resource) => ({ resource, actions: CRUD }))],

  // Multi Branch Manager — same access as Branch Manager, scoped across all
  // branches (branch scoping is enforced elsewhere, not via module grants).
  'Multi Branch Manager': [
    ANCHOR,
    ...ALL_MODULES.filter((m) => m !== 'settings').map((resource) => ({ resource, actions: CRUD })),
  ],

  // Branch Manager — runs a single branch: everything operational, no settings.
  'Branch Manager': [
    ANCHOR,
    ...ALL_MODULES.filter((m) => m !== 'settings').map((resource) => ({ resource, actions: CRUD })),
  ],

  Waiter: [
    ANCHOR,
    { resource: 'dashboard', actions: R },
    { resource: 'pos', actions: CRUD },
    { resource: 'orders', actions: CRUD },
    { resource: 'tables', actions: R },
    { resource: 'kds', actions: R },
    { resource: 'customers', actions: CRUD },
  ],

  Chef: [
    ANCHOR,
    { resource: 'dashboard', actions: R },
    { resource: 'kds', actions: CRUD },
    { resource: 'orders', actions: R },
    { resource: 'menu', actions: R },
  ],

  'Delivery Rider': [
    ANCHOR,
    { resource: 'dashboard', actions: R },
    { resource: 'orders', actions: CRUD },
  ],

  // Customers are guests — no dashboard modules, just the link anchor.
  Customer: [ANCHOR],
};
