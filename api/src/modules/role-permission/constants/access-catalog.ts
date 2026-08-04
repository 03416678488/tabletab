import { PermissionsEnum } from '@modules/permissions/enums/permissions.enum';

/** The fixed set of roles surfaced in the permissions manager. */
export const MANAGED_ROLES = [
  'Administrators',
  'Delivery Boys',
  'Customers',
  'Employees',
  'Waiters',
  'Chefs',
] as const;

/** App modules an admin can grant per role. `key` is the stable resource id. */
export const MODULES: { key: string; label: string; group: string }[] = [
  { key: 'dashboard', label: 'Dashboard', group: 'Operations' },
  { key: 'orders', label: 'Orders', group: 'Operations' },
  { key: 'pos', label: 'POS', group: 'Operations' },
  { key: 'kds', label: 'Kitchen (KDS)', group: 'Operations' },
  { key: 'oss', label: 'Order Status (OSS)', group: 'Operations' },
  { key: 'menu', label: 'Menu', group: 'Catalog' },
  { key: 'categories', label: 'Categories', group: 'Catalog' },
  { key: 'tables', label: 'Tables', group: 'Catalog' },
  { key: 'areas', label: 'Areas', group: 'Catalog' },
  { key: 'qr-codes', label: 'QR Codes', group: 'Catalog' },
  { key: 'branches', label: 'Branches', group: 'Management' },
  { key: 'users', label: 'Users', group: 'Management' },
  { key: 'customers', label: 'Customers', group: 'Management' },
  { key: 'reports', label: 'Reports', group: 'Management' },
  { key: 'settings', label: 'Settings', group: 'Management' },
];

export const MODULE_KEYS = MODULES.map((m) => m.key);

export const ALL_ACTIONS: PermissionsEnum[] = [
  PermissionsEnum.CREATE,
  PermissionsEnum.READ,
  PermissionsEnum.UPDATE,
  PermissionsEnum.DELETE,
];
