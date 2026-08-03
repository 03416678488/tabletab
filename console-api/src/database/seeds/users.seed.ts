/**
 * Control-plane users. The platform admin has the "Super Admin" role, which the
 * console's PlatformAdminGuard requires (isSuperAdmin). Restaurant/demo logins
 * intentionally live in each tenant's own database, not here.
 */
export const USERS_SEED = [
  {
    firstName: 'Platform',
    lastName: 'Admin',
    email: 'admin@tabletap.io',
    password: 'Admin@12345',
    phoneNumber: '+10000000000',
    isActive: true,
    emailVerified: true,
    role: 'Super Admin',
  },
];
