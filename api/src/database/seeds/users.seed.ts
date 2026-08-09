interface SeedUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  isActive: boolean;
  emailVerified: boolean;
  role: string;
  /** Home branch name (branches.seed). Single-branch staff only. */
  branch?: string;
}

/**
 * One login per fixed role. The Owner is the top admin (full access); every
 * other login uses the password Passw0rd@123. Single-branch staff are pinned to
 * a home branch; Owner / Multi Branch Manager / Customer span all branches.
 */
export const USERS_SEED: SeedUser[] = [
  {
    firstName: 'Olivia',
    lastName: 'Owner',
    email: 'owner@example.com',
    password: 'Owner@123',
    phoneNumber: '+1234567910',
    isActive: true,
    emailVerified: true,
    role: 'Owner',
  },
  {
    firstName: 'Max',
    lastName: 'Regional',
    email: 'multibranch@example.com',
    password: 'Passw0rd@123',
    phoneNumber: '+1234567911',
    isActive: true,
    emailVerified: true,
    role: 'Multi Branch Manager',
  },
  {
    firstName: 'Ben',
    lastName: 'Manager',
    email: 'branchmanager@example.com',
    password: 'Passw0rd@123',
    phoneNumber: '+1234567912',
    isActive: true,
    emailVerified: true,
    branch: 'Renala Branch',
    role: 'Branch Manager',
  },
  {
    firstName: 'Chris',
    lastName: 'Cook',
    email: 'chef@example.com',
    password: 'Passw0rd@123',
    phoneNumber: '+1234567905',
    isActive: true,
    emailVerified: true,
    branch: 'Renala Branch',
    role: 'Chef',
  },
  {
    firstName: 'Wendy',
    lastName: 'Server',
    email: 'waiter@example.com',
    password: 'Passw0rd@123',
    phoneNumber: '+1234567904',
    isActive: true,
    emailVerified: true,
    branch: 'Renala Branch',
    role: 'Waiter',
  },
  {
    firstName: 'Dan',
    lastName: 'Rider',
    email: 'delivery@example.com',
    password: 'Passw0rd@123',
    phoneNumber: '+1234567901',
    isActive: true,
    emailVerified: true,
    branch: 'Renala Branch',
    role: 'Delivery Rider',
  },
  {
    firstName: 'Cara',
    lastName: 'Guest',
    email: 'customer@example.com',
    password: 'Passw0rd@123',
    phoneNumber: '+1234567902',
    isActive: true,
    emailVerified: true,
    role: 'Customer',
  },
];
